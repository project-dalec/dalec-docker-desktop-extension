import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  TextField,
  Chip,
  Collapse,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { Package, VersionConstraint } from '../types';
import { VERSION_OPS } from '../constants/targets';

interface PackageRowProps {
  pkg: Package;
  onUpdate: (updated: Package) => void;
  onRemove: () => void;
}

/**
 * Single row in the package list, representing one declared dependency.
 *
 * Shows the package name and, when constraints exist, a summary chip.
 * An expandable version-constraint panel lets the user add, edit, or remove
 * semver constraints (operator + version value) for the package.
 * The row also exposes a remove button to delete the package from the list
 * entirely via the `onRemove` callback.
 */
export const PackageRow: React.FC<PackageRowProps> = ({ pkg, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = useState(pkg.versions.some((v) => v.op && v.val));

  const activeConstraints = pkg.versions.filter((v) => v.op && v.val);

  const addConstraint = () => {
    onUpdate({ ...pkg, versions: [...pkg.versions, { op: '>=', val: '' }] });
    setExpanded(true);
  };

  const updateConstraint = (i: number, field: keyof VersionConstraint, val: string) => {
    const next = [...pkg.versions];
    next[i] = { ...next[i], [field]: val };
    onUpdate({ ...pkg, versions: next });
  };

  const removeConstraint = (i: number) => {
    const next = pkg.versions.filter((_, j) => j !== i);
    onUpdate({ ...pkg, versions: next });
    if (!next.length) setExpanded(false);
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderColor: 'divider',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: '7px',
        overflow: 'hidden',
      }}
      data-testid={`package-row-${pkg.name}`}
    >
      {/* Header row */}
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={{ px: 1.5, py: 1.125 }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            color: 'success.main',
            flex: 1,
          }}
        >
          {pkg.name}
        </Typography>

        {activeConstraints.length > 0 && (
          <Chip
            label={activeConstraints.map((v) => `${v.op}${v.val}`).join(', ')}
            size="small"
            sx={{
              height: 18,
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'warning.main',
              bgcolor: 'action.selected',
              borderColor: 'warning.main',
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: '3px',
              '.MuiChip-label': { px: 0.875 },
            }}
          />
        )}

        <IconButton
          size="small"
          onClick={addConstraint}
          title="Add version constraint"
          sx={{
            fontSize: 10,
            fontFamily: 'inherit',
            borderColor: 'divider',
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: '4px',
            px: 1,
            py: 0.25,
            color: 'text.disabled',
            '&:hover': { color: 'warning.main', borderColor: 'warning.main' },
          }}
        >
          <AddIcon sx={{ fontSize: 12 }} />
          <Typography variant="caption" sx={{ ml: 0.25, fontSize: 10 }}>version</Typography>
        </IconButton>

        <IconButton
          size="small"
          onClick={onRemove}
          aria-label={`Remove ${pkg.name}`}
          sx={{
            color: 'text.disabled',
            '&:hover': { color: 'error.main' },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Version constraints */}
      <Collapse in={expanded && pkg.versions.length > 0}>
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 1.5,
            py: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.75,
            bgcolor: 'action.hover',
          }}
        >
          {pkg.versions.map((vc, i) => (
            <Box key={i} display="flex" gap={0.75} alignItems="center">
              <Select
                value={vc.op}
                onChange={(e: SelectChangeEvent) => updateConstraint(i, 'op', e.target.value)}
                size="small"
                sx={{
                  width: 72,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {VERSION_OPS.map((op) => (
                  <MenuItem key={op} value={op} sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                    {op}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                value={vc.val}
                onChange={(e) => updateConstraint(i, 'val', e.target.value)}
                placeholder="1.0.0"
                size="small"
                sx={{ flex: 1, '& input': { fontFamily: 'JetBrains Mono, monospace', fontSize: 12 } }}
              />

              <IconButton
                size="small"
                onClick={() => removeConstraint(i)}
                aria-label="Remove constraint"
                sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default PackageRow;
