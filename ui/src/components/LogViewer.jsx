import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  Stack,
  Snackbar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function LogViewer({ buildId }) {
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    const handler = (e) => {
      setLogs(l => [...l, e.detail]);
    };
    window.addEventListener('dalec-log', handler);
    return () => window.removeEventListener('dalec-log', handler);
  }, []);

  useEffect(() => {
    if (!buildId) setLogs([]);
  }, [buildId]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const getLogColor = (line) => {
    if (line.includes('[stage-') || line.includes('=> [')) {
      return theme.palette.info.main;
    }
    if (line.toLowerCase().includes('error')) {
      return theme.palette.error.main;
    }
    if (line.toLowerCase().includes('warning')) {
      return theme.palette.warning.main;
    }
    if (line.includes('DONE') || line.includes('✓')) {
      return theme.palette.success.main;
    }
    return theme.palette.text.primary;
  };

  const getLogWeight = (line) => {
    if (line.includes('[stage-') || line.includes('=> [') ||
        line.toLowerCase().includes('error') ||
        line.includes('DONE') || line.includes('✓')) {
      return 600;
    }
    return 400;
  };

  const copyLogsToClipboard = () => {
    const logText = logs.join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      setCopySuccess(true);
    }).catch(err => {
      console.error('Failed to copy logs:', err);
    });
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
        <FormControlLabel
          control={
            <Checkbox
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">Auto-scroll</Typography>}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => setLogs([])}
        >
          Clear Logs
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={copyLogsToClipboard}
          disabled={logs.length === 0}
        >
          Copy Logs
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        ref={logContainerRef}
        onScroll={handleScroll}
        sx={{
          height: 320,
          overflow: 'auto',
          p: 1.5,
          bgcolor: 'background.default',
          fontFamily: 'monospace',
          fontSize: '0.7rem'
        }}
      >
        {logs.length === 0 && (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            No logs yet. Start a build to see output.
          </Typography>
        )}
        {logs.map((l, i) => (
          <Box
            key={i}
            display="flex"
            gap={1}
            sx={{ py: 0.1 }}
          >
            <Typography
              component="span"
              sx={{
                color: 'text.disabled',
                minWidth: '2.5rem',
                textAlign: 'right',
                userSelect: 'none',
                fontFamily: 'monospace',
                fontSize: '0.7rem'
              }}
            >
              {i + 1}
            </Typography>
            <Typography
              component="span"
              sx={{
                flex: 1,
                whiteSpace: 'pre-wrap',
                color: getLogColor(l),
                fontWeight: getLogWeight(l),
                fontFamily: 'monospace',
                fontSize: '0.7rem'
              }}
            >
              {l}
            </Typography>
          </Box>
        ))}
        <div ref={logEndRef} />
      </Paper>

      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        message="Logs copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
