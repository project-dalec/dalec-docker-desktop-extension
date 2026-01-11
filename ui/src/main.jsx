import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ThemeProvider from './ThemeProvider.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
