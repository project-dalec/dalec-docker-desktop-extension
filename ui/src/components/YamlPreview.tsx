import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { categorizeYamlLine } from '../utils/yamlGenerator';
import type { YamlLineCategory } from '../utils/yamlGenerator';

interface YamlPreviewProps {
  yaml: string;
  buildCommand: string;
}

/**
 * Syntax-highlighted YAML preview with build command display.
 *
 * Renders the generated Dalec spec YAML line-by-line, colouring each line
 * according to its semantic category (comment, top-level key, sub-key,
 * package leaf, version constraint, etc.) using a palette that adapts to the
 * current MUI theme mode (dark vs light) for readability in both themes.
 *
 * Below the YAML block a second code box shows the ready-to-run
 * `docker buildx build` command derived from the current spec.
 *
 * A "Copy YAML" icon button in the header copies the raw YAML string to the
 * clipboard and shows a brief tooltip confirmation.
 */
export const YamlPreview: React.FC<YamlPreviewProps> = ({ yaml, buildCommand }) => {
  const [copied, setCopied] = React.useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const categoryColors: Record<YamlLineCategory, string> = isDark
    ? {
        comment:     '#5a6a7e',
        topKey:      '#7ec8ff',
        subKey:      '#b088ff',
        packageLeaf: '#00d28c',
        packageName: '#aaddff',
        constraint:  'rgba(255,180,60,0.9)',
        default:     '#c8d8e8',
      }
    : {
        comment:     '#6a737d',
        topKey:      '#0451a5',
        subKey:      '#7a3e9d',
        packageLeaf: '#1a7a40',
        packageName: '#0070c1',
        constraint:  '#b5611b',
        default:     theme.palette.text.primary,
      };

  const handleCopy = () => {
    navigator.clipboard?.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2.5}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: '-0.3px' }}>
            Review your spec
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Confirm the generated YAML looks correct before building.
          </Typography>
        </Box>
        <Tooltip title={copied ? 'Copied!' : 'Copy YAML'}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '6px',
              px: 1.5,
              gap: 0.5,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <ContentCopyIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption">Copy YAML</Typography>
          </IconButton>
        </Tooltip>
      </Box>

      {/* YAML block */}
      <Box
        sx={{
          bgcolor: 'action.hover',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '10px',
          p: 2.5,
          overflowX: 'auto',
        }}
      >
        <Box
          component="pre"
          sx={{
            m: 0,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12.5,
            lineHeight: 1.8,
            whiteSpace: 'pre',
          }}
        >
          {yaml.split('\n').map((line, i) => (
            <Box
              key={i}
              component="span"
              sx={{ color: categoryColors[categorizeYamlLine(line)], display: 'block' }}
            >
              {line || '\u00a0'}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Build command */}
      <Box
        sx={{
          bgcolor: 'action.hover',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '8px',
          p: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 1,
            fontWeight: 600,
            color: 'text.disabled',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Build Command
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
            color: isDark ? '#7ec8ff' : theme.palette.primary.main,
            lineHeight: 1.7,
            whiteSpace: 'pre',
          }}
        >
          {buildCommand}
        </Box>
      </Box>
    </Box>
  );
};

export default YamlPreview;
