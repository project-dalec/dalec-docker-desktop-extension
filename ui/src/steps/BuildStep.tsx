import React from 'react';
import { Box, Typography, LinearProgress, Button, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { BuildLog } from '../components/BuildLog';
import { ImageDetails } from '../components/ImageDetails';
import type { BuildResult, ImageSpec } from '../types';

interface BuildStepProps {
  spec: ImageSpec;
  building: boolean;
  buildDone: boolean;
  logLines: string[];
  buildResult: BuildResult | null;
  onBack: () => void;
  onNewBuild: () => void;
  onClearLogs: () => void;
}

export const BuildStep: React.FC<BuildStepProps> = ({
  spec,
  building,
  buildDone,
  logLines,
  buildResult,
  onBack,
  onNewBuild,
  onClearLogs,
}) => {
  // Parse the highest BuildKit step number from log lines (e.g. "#18 ...")
  // and map it to an approximate progress percentage.
  // NOTE: These thresholds are empirical, based on a typical dalec build which
  // produces ~19 BuildKit steps. Different image configurations may produce
  // more or fewer steps, so this is a rough heuristic, not an exact measure.
  const progressPct = (() => {
    if (buildDone) return 100;
    if (!building || logLines.length === 0) return 0;

    let maxStep = 0;
    for (const line of logLines) {
      const m = line.match(/^#(\d+)\b/);
      if (m) maxStep = Math.max(maxStep, Number(m[1]));
    }

    if (maxStep >= 19) return 96;
    if (maxStep >= 18) return 70;
    if (maxStep >= 14) return 45;
    if (maxStep >= 10) return 30;
    if (maxStep >= 5)  return 15;
    return 5;
  })();

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* Status header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: '-0.3px' }}>
            {buildDone ? 'Build complete' : building ? 'Building image…' : 'Ready to build'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
            sx={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {spec.name}:{spec.version} → {spec.target?.label ?? '—'}
          </Typography>
        </Box>

        {buildDone && (
          <Chip
            label="Success"
            size="small"
            icon={
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#00d28c',
                  ml: '6px !important',
                }}
              />
            }
            sx={{
              color: '#00d28c',
              background: 'rgba(0,210,140,0.08)',
              border: '1px solid rgba(0,210,140,0.2)',
              borderRadius: 10,
              fontWeight: 600,
            }}
          />
        )}

        {building && (
          <Chip
            label="Building…"
            size="small"
            icon={
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#5599ff',
                  ml: '6px !important',
                  '@keyframes pulse': {
                    '0%,100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                  animation: 'pulse 1s infinite',
                }}
              />
            }
            sx={{
              color: '#5599ff',
              background: 'rgba(0,87,255,0.08)',
              border: '1px solid rgba(0,87,255,0.2)',
              borderRadius: 10,
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progressPct}
        sx={{
          height: 3,
          borderRadius: 99,
          backgroundColor: (theme) => alpha(theme.palette.common.white, 0.06),
          '& .MuiLinearProgress-bar': {
            borderRadius: 99,
            background: buildDone ? '#00d28c' : 'linear-gradient(90deg, #0057ff, #00d28c)',
            transition: 'transform 0.4s ease',
          },
        }}
      />

      {/* Log */}
      <BuildLog logLines={logLines} building={building} onClear={onClearLogs} />

      {/* Image details after build */}
      {buildDone && buildResult && (
        <ImageDetails
          result={buildResult}
          spec={spec}
          onNewBuild={onNewBuild}
        />
      )}

      {/* Back button — only when idle (not building, not done) */}
      {!buildDone && !building && (
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ alignSelf: 'flex-start', color: 'text.secondary' }}
        >
          Back
        </Button>
      )}
    </Box>
  );
};

export default BuildStep;
