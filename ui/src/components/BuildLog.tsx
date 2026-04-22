import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Snackbar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface BuildLogProps {
  logLines: string[];
  building: boolean;
  onClear?: () => void;
}

function getLineColor(line: string, mode: 'light' | 'dark'): string {
  const lower     = line.toLowerCase();
  const isSuccess = line.includes('✓') || line.includes('done') || line.toUpperCase().includes('SUCCESS');
  const isError   = lower.includes('error') || lower.includes('failed');
  const isWarn    = lower.includes('warn');
  const isStage   = line.includes('[stage-') || line.includes('=> [') || line.startsWith('[+]');

  if (isSuccess) return mode === 'dark' ? '#4ade80' : '#166534';
  if (isError)   return mode === 'dark' ? '#f87171' : '#b91c1c';
  if (isWarn)    return mode === 'dark' ? '#facc15' : '#92400e';
  if (isStage)   return mode === 'dark' ? '#7dd3fc' : '#075985';
  return mode === 'dark' ? '#e5e7eb' : '#374151';
}

/**
 * Scrollable terminal-style build log viewer.
 *
 * Renders each log line with colour-coded semantics (success, error, warning,
 * build stage) using a monospace font. Supports:
 * - **Auto-scroll** — keeps the viewport pinned to the bottom while new lines
 *   arrive; automatically pauses when the user scrolls up.
 * - **Clear** — removes all accumulated lines via the `onClear` callback.
 * - **Copy Logs** — writes all lines to the clipboard and shows a brief Snackbar
 *   confirmation.
 * - A blinking cursor indicator rendered while `building` is true.
 */
export const BuildLog: React.FC<BuildLogProps> = ({ logLines, building, onClear }) => {
  const theme = useTheme();
  const mode  = theme.palette.mode;
  const [autoScroll, setAutoScroll] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logLines, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logLines.join('\n')).then(() => {
      setCopySuccess(true);
    });
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
        <FormControlLabel
          control={
            <Checkbox
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">Auto-scroll</Typography>}
          sx={{ mr: 0 }}
        />
        <Button size="small" variant="outlined" onClick={onClear} disabled={logLines.length === 0}>
          Clear
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={handleCopyLogs}
          disabled={logLines.length === 0}
        >
          Copy Logs
        </Button>
      </Box>

      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          bgcolor: 'action.hover',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '10px',
          p: 2,
          minHeight: 260,
          maxHeight: 360,
          overflowY: 'auto',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          lineHeight: 1.8,
          '::-webkit-scrollbar': { width: 5 },
          '::-webkit-scrollbar-thumb': {
            background: theme.palette.action.disabled,
            borderRadius: 99,
          },
        }}
      >
        {logLines.length === 0 && (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">
            Waiting for build to start…
          </Typography>
        )}
        {logLines.map((line, i) => (
          <Box key={i} display="flex" gap={1} sx={{ py: 0.1 }}>
            <Typography
              component="span"
              sx={{
                color: 'text.disabled',
                minWidth: '2rem',
                textAlign: 'right',
                userSelect: 'none',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
              }}
            >
              {i + 1}
            </Typography>
            <Typography
              component="span"
              sx={{
                flex: 1,
                whiteSpace: 'pre-wrap',
                color: getLineColor(line, mode),
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
              }}
            >
              {line || '\u00a0'}
            </Typography>
          </Box>
        ))}
        {building && (
          <Typography
            component="span"
            sx={{ color: theme.palette.primary.main, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
          >
            ▌
          </Typography>
        )}
        <div ref={endRef} />
      </Box>

      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        message="Logs copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default BuildLog;
