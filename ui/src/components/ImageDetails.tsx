import React, { useState } from 'react';
import { Box, Typography, Button, Grid2 as Grid, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import type { BuildResult, ImageSpec } from '../types';

interface ImageDetailsProps {
  result: BuildResult;
  spec: ImageSpec;
  onNewBuild: () => void;
}

interface DetailFieldProps {
  label: string;
  value: string;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        mb: 0.5,
        fontWeight: 600,
        color: 'text.disabled',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="caption"
      sx={{
        fontFamily: 'JetBrains Mono, monospace',
        color: 'text.primary',
        wordBreak: 'break-all',
        display: 'block',
      }}
    >
      {value}
    </Typography>
  </Box>
);

export const ImageDetails: React.FC<ImageDetailsProps> = ({
  result,
  spec,
  onNewBuild,
}) => {
  const [copied, setCopied]             = useState(false);
  const [digestCopied, setDigestCopied] = useState(false);
  const totalPkgs = spec.packages.length;

  const handleCopy = () => {
    navigator.clipboard?.writeText(result.imageName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const digest        = result.digest ?? '';
  const digestDisplay = digest ? digest.slice(0, 15) + '…' : '—';

  const handleCopyDigest = () => {
    if (!digest) return;
    navigator.clipboard?.writeText(digest);
    setDigestCopied(true);
    setTimeout(() => setDigestCopied(false), 2000);
  };

  const infoFields: [string, string][] = [
    ['Target',     result.osTarget],
    ['Packages',   `${totalPkgs} installed`],
    ['Entrypoint', spec.entrypoint || '—'],
    ['Cmd',        spec.cmd || '—'],
  ];

  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.25,
          py: 1.5,
          bgcolor: 'background.paper',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Image Details
        </Typography>
        <Tooltip title={new Date(result.finishedAt).toLocaleString()} placement="top">
          <Typography variant="caption" color="text.disabled">
            now
          </Typography>
        </Tooltip>
      </Box>

      {/* Fields grid */}
      <Box sx={{ px: 2.25, py: 2 }}>
        <Grid container spacing={2}>

          {/* Image name with inline copy icon */}
          <Grid size={{ xs: 4 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.5,
                fontWeight: 600,
                color: 'text.disabled',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Image
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'text.primary',
                  wordBreak: 'break-all',
                }}
              >
                {result.imageName}
              </Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy image name'} placement="top">
                <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25, flexShrink: 0 }}>
                  {copied
                    ? <CheckIcon sx={{ fontSize: 13, color: 'success.main' }} />
                    : <ContentCopyIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  }
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>

          {/* Digest with truncation + tooltip + copy */}
          <Grid size={{ xs: 4 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.5,
                fontWeight: 600,
                color: 'text.disabled',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Digest
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Tooltip title={digest || 'Not available'} placement="top">
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.primary' }}
                >
                  {digestDisplay}
                </Typography>
              </Tooltip>
              {digest && (
                <Tooltip title={digestCopied ? 'Copied!' : 'Copy digest'} placement="top">
                  <IconButton size="small" onClick={handleCopyDigest} sx={{ p: 0.25, flexShrink: 0 }}>
                    {digestCopied
                      ? <CheckIcon sx={{ fontSize: 13, color: 'success.main' }} />
                      : <ContentCopyIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    }
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>

          {/* Remaining fields */}
          {infoFields.map(([label, value]) => (
            <Grid key={label} size={{ xs: 4 }}>
              <DetailField label={label} value={value} />
            </Grid>
          ))}

        </Grid>
      </Box>

      {/* Actions */}
      <Box
        display="flex"
        gap={1}
        sx={{
          px: 2.25,
          py: 1.5,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="outlined"
          onClick={onNewBuild}
          sx={{ color: 'text.disabled', borderColor: (theme) => alpha(theme.palette.divider, 0.6) }}
        >
          New build
        </Button>
      </Box>
    </Box>
  );
};

export default ImageDetails;
