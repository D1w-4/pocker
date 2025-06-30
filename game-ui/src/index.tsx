import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from 'app';
import '@mantine/core/styles.css';

const root = document.getElementById('root');

createRoot(root!).render(
  <StrictMode>
    <App/>
  </StrictMode>
);

