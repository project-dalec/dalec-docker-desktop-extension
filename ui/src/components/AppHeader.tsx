import React from 'react';
import { AppBar, Toolbar, Box, Typography, Container } from '@mui/material';
import logoSvg from '../assets/logo.svg';

/**
 * Sticky top bar shown on every step.
 *
 * Hosts the Dalec logo and title only; all step-specific context now lives
 * within the main page content instead of in the header.
 */
export const AppHeader: React.FC = () => {

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="md">
        <Toolbar disableGutters sx={{ minHeight: 52, px: 3, gap: 1.5 }}>
        {/* Logo */}
        <Box
          component="img"
          src={logoSvg}
          alt="Dalec"
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
          }}
        />

        <Typography variant="subtitle1" fontWeight={600} sx={{ letterSpacing: '-0.3px' }}>
          Dalec
        </Typography>
        <Typography variant="body2" color="text.disabled">
          / Container Builder
        </Typography>

        <Box sx={{ flex: 1 }} />
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default AppHeader;
