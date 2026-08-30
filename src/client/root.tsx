import { createRoot } from 'react-dom/client';
import { App } from './app.js';
import React from 'react';
import { tryGetMe } from './login.js';
import './global-style.css.js';

tryGetMe();

const root = createRoot(document.getElementById('root')!);

root.render(<App />);
