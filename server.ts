import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ClothStore Pro Desktop & Web Engine',
      mode: process.env.NODE_ENV || 'development'
    });
  });

  // App Metadata info
  app.get('/api/info', (req, res) => {
    res.json({
      name: 'ClothStore Pro',
      version: '1.0.0',
      type: 'Offline Cloth Store Inventory & Management Software',
      architecture: 'Offline-First Electron + React + TypeScript + SQLite'
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClothStore Pro Server running at http://localhost:${PORT}`);
  });
}

startServer();
