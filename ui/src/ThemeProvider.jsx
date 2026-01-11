import React from 'react';
import { CssBaseline } from '@mui/material';
import { DockerMuiV6ThemeProvider } from '@docker/docker-mui-theme';

export default function ThemeProvider({ children }) {
  return (
    <DockerMuiV6ThemeProvider>
      <CssBaseline />
      {children}
    </DockerMuiV6ThemeProvider>
  );
}
