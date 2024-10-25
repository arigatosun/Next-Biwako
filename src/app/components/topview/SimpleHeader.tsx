'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';

const SimpleHeader: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <Typography variant={isMobile ? 'h6' : 'h5'} component="div">
         
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default SimpleHeader;
