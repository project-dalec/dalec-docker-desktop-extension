import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid2 as Grid,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { TargetSelect } from '../components/TargetSelect';
import { PackageManager } from '../components/PackageManager';
import { ImageConfig } from '../components/ImageConfig';
import { FieldLabel } from '../components/FieldLabel';
import type { ImageSpec, Target, PackagesMap, KVItem } from '../types';

interface ConfigureStepProps {
  spec: ImageSpec;
  availableTargets: Target[];
  targetsLoading: boolean;
  availablePackages: string[];
  onSpecChange: (patch: Partial<ImageSpec>) => void;
  onNext: () => void;
  onSkipToBuild: () => void;
}

const SectionBox: React.FC<{ title: string; children: React.ReactNode; overflow?: string }> = ({
  title,
  children,
  overflow = 'hidden',
}) => (
  <Box
    sx={{
      border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      borderRadius: '10px',
      overflow,
    }}
  >
    <Box
      sx={{
        px: 2.25,
        py: 1.5,
        background: (theme) => alpha(theme.palette.common.white, 0.02),
        borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.4)}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: '0.02em' }}
      >
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: 2.25 }}>{children}</Box>
  </Box>
);

export const ConfigureStep: React.FC<ConfigureStepProps> = ({
  spec,
  availableTargets,
  targetsLoading,
  availablePackages,
  onSpecChange,
  onNext,
  onSkipToBuild,
}) => {
  const family = spec.target?.family ?? 'deb';
  const totalPkgs = Object.values(spec.packages).flat().length;
  const isValid = !!(spec.name && spec.version && spec.description && spec.website && spec.license && totalPkgs > 0);

  return (
    <Box display="flex" flexDirection="column" gap={2.5}>
      {/* Identity + Metadata */}
      <SectionBox title="Image Metadata">
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 5 }}>
            <FieldLabel required>Name</FieldLabel>
            <TextField
              value={spec.name}
              onChange={(e) => onSpecChange({ name: e.target.value })}
              placeholder="my-image"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FieldLabel required>Version</FieldLabel>
            <TextField
              value={spec.version}
              onChange={(e) => onSpecChange({ version: e.target.value })}
              placeholder="0.1.0"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <FieldLabel>Revision</FieldLabel>
            <TextField
              value={spec.revision}
              onChange={(e) => onSpecChange({ revision: e.target.value })}
              placeholder="1"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FieldLabel required>Description</FieldLabel>
            <TextField
              value={spec.description}
              onChange={(e) => onSpecChange({ description: e.target.value })}
              placeholder="A short description of this image"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <FieldLabel required>Website</FieldLabel>
            <TextField
              value={spec.website}
              onChange={(e) => onSpecChange({ website: e.target.value })}
              placeholder="https://example.com"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <FieldLabel required>License</FieldLabel>
            <TextField
              value={spec.license}
              onChange={(e) => onSpecChange({ license: e.target.value })}
              placeholder="Apache-2.0"
              size="small"
              fullWidth
            />
          </Grid>
        </Grid>
      </SectionBox>

      {/* Target distro */}
      <SectionBox title="Target Distro" overflow="visible">
        <TargetSelect
          value={spec.target}
          options={availableTargets}
          loading={targetsLoading}
          onChange={(t) => onSpecChange({ target: t })}
        />
      </SectionBox>

      {/* Dependencies */}
      <SectionBox title="Dependencies">
        <Box sx={{ opacity: targetsLoading ? 0.4 : 1, pointerEvents: targetsLoading ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
          <PackageManager
            packages={spec.packages}
            availablePackages={availablePackages}
            family={family}
            onChange={(updated: PackagesMap) => onSpecChange({ packages: updated })}
          />
        </Box>
      </SectionBox>

      {/* Image config (collapsible) */}
      <ImageConfig
        entrypoint={spec.entrypoint}
        cmd={spec.cmd}
        workdir={spec.workdir}
        user={spec.user}
        envVars={spec.envVars}
        labels={spec.labels}
        onEntrypointChange={(v) => onSpecChange({ entrypoint: v })}
        onCmdChange={(v) => onSpecChange({ cmd: v })}
        onWorkdirChange={(v) => onSpecChange({ workdir: v })}
        onUserChange={(v) => onSpecChange({ user: v })}
        onEnvVarsChange={(items: KVItem[]) => onSpecChange({ envVars: items })}
        onLabelsChange={(items: KVItem[]) => onSpecChange({ labels: items })}
      />

      {/* Footer actions */}
      <Box display="flex" justifyContent="flex-end" gap={1.5} pt={0.5}>
        <Button
          variant="outlined"
          disabled={!isValid}
          onClick={onSkipToBuild}
          sx={{ color: 'text.secondary', borderColor: (theme) => alpha(theme.palette.divider, 0.6) }}
        >
          Skip preview &amp; Build
        </Button>
        <Button
          variant="contained"
          disabled={!isValid}
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
          sx={{ px: 3 }}
        >
          Preview YAML
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigureStep;
