import React from 'react';
import { createRoot } from 'react-dom/client';
import { Checkout } from './pages/Checkout.js';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Checkout />
  </React.StrictMode>,
);
