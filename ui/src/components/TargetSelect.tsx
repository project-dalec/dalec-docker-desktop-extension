import React from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Target } from '../types';

interface TargetSelectProps {
  value: Target | null;
  options: Target[];
  loading: boolean;
  onChange: (target: Target | null) => void;
}

const GROUP_ORDER: Record<string, number> = {
  'Debian / Ubuntu': 0,
  'RPM-based':       1,
  'Windows':         2,
};

export const TargetSelect: React.FC<TargetSelectProps> = ({ value, options, loading, onChange }) => {
  const sortedOptions = [...options].sort(
    (a, b) =>
      (GROUP_ORDER[a.group] ?? 99) - (GROUP_ORDER[b.group] ?? 99) ||
      a.label.localeCompare(b.label),
  );

  return (
    <Box>
      <Autocomplete<Target>
        value={value}
        options={sortedOptions}
        loading={loading}
        groupBy={(t) => t.group}
        getOptionLabel={(t) => t.label}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onChange={(_, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={loading ? 'Loading targets…' : 'Select target distro…'}
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'inherit',
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          return (
            <Box
              component="li"
              {...props}
              key={option.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                px: 1.5,
                py: 1,
              }}
            >
              <Typography variant="body2">{option.label}</Typography>
              <Chip
                label={option.family}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'primary.main',
                  bgcolor: 'action.hover',
                  borderColor: 'divider',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderRadius: '3px',
                  '.MuiChip-label': { px: 0.75 },
                }}
              />
            </Box>
          );
        }}
        renderGroup={(params) => (
          <Box key={params.key}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                px: 1.5,
                pt: 1,
                pb: 0.5,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.disabled',
              }}
            >
              {params.group}
            </Typography>
            {params.children}
          </Box>
        )}
        slotProps={{
          paper: {
            sx: {
              background: (theme) => theme.palette.background.paper,
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            },
          },
        }}
      />

    </Box>
  );
};

export default TargetSelect;
