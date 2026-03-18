import React from 'react';
import { CssBaseline } from '@mui/material';
import { DockerMuiV6ThemeProvider } from '@docker/docker-mui-theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => (
  <DockerMuiV6ThemeProvider>
    <CssBaseline />
    {children}
  </DockerMuiV6ThemeProvider>
);

export default ThemeProvider;
