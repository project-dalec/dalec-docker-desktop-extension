import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid2 as Grid,
  Collapse,
  ButtonBase,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { KVList } from './KVList';
import { FieldLabel } from './FieldLabel';
import type { KVItem } from '../types';

interface ImageConfigProps {
  entrypoint: string;
  cmd: string;
  workdir: string;
  user: string;
  envVars: KVItem[];
  labels: KVItem[];
  onEntrypointChange: (v: string) => void;
  onCmdChange: (v: string) => void;
  onWorkdirChange: (v: string) => void;
  onUserChange: (v: string) => void;
  onEnvVarsChange: (items: KVItem[]) => void;
  onLabelsChange: (items: KVItem[]) => void;
}

/**
 * Collapsible panel for optional Docker image runtime configuration.
 *
 * Collapsed by default to keep the Configure step uncluttered. When expanded
 * it exposes fields for `entrypoint`, `cmd`, `workdir`, and `user`, plus
 * editable `KVList` editors for environment variables and image labels.
 * All changes are surfaced immediately via individual `onChange` callbacks.
 */
export const ImageConfig: React.FC<ImageConfigProps> = ({
  entrypoint, cmd, workdir, user,
  envVars, labels,
  onEntrypointChange, onCmdChange, onWorkdirChange, onUserChange,
  onEnvVarsChange, onLabelsChange,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <ButtonBase
        onClick={() => setOpen((o) => !o)}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.25,
          py: 1.75,
          background: (theme) => alpha(theme.palette.common.white, 0.02),
          '&:hover': { background: (theme) => alpha(theme.palette.common.white, 0.04) },
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          Image Configuration
        </Typography>
        <ExpandMoreIcon
          sx={{
            fontSize: 16,
            color: 'text.disabled',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </ButtonBase>

      <Collapse in={open}>
        <Box
          sx={{
            px: 2.25,
            py: 2,
            borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.4)}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <FieldLabel>Entrypoint</FieldLabel>
              <TextField
                value={entrypoint}
                onChange={(e) => onEntrypointChange(e.target.value)}
                placeholder="/usr/bin/curl"
                size="small"
                fullWidth
                sx={{ '& input': { fontFamily: 'JetBrains Mono, monospace', fontSize: 12 } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldLabel>Cmd</FieldLabel>
              <TextField
                value={cmd}
                onChange={(e) => onCmdChange(e.target.value)}
                placeholder="--version"
                size="small"
                fullWidth
                sx={{ '& input': { fontFamily: 'JetBrains Mono, monospace', fontSize: 12 } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldLabel>Working Directory</FieldLabel>
              <TextField
                value={workdir}
                onChange={(e) => onWorkdirChange(e.target.value)}
                placeholder="/app"
                size="small"
                fullWidth
                sx={{ '& input': { fontFamily: 'JetBrains Mono, monospace', fontSize: 12 } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FieldLabel>User</FieldLabel>
              <TextField
                value={user}
                onChange={(e) => onUserChange(e.target.value)}
                placeholder="nobody"
                size="small"
                fullWidth
                sx={{ '& input': { fontFamily: 'JetBrains Mono, monospace', fontSize: 12 } }}
              />
            </Grid>
          </Grid>

          <Box>
            <FieldLabel>Environment Variables</FieldLabel>
            <KVList items={envVars} onChange={onEnvVarsChange} keyPlaceholder="KEY" valuePlaceholder="VALUE" />
          </Box>

          <Box>
            <FieldLabel>Labels</FieldLabel>
            <KVList items={labels} onChange={onLabelsChange} keyPlaceholder="com.example.label" valuePlaceholder="value" />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ImageConfig;
