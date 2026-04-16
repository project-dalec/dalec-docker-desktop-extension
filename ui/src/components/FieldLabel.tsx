import React from 'react';
import { Typography } from '@mui/material';

export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      display: 'block',
      mb: 0.75,
      fontWeight: 600,
      color: 'text.disabled',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </Typography>
);
