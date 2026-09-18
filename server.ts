import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { logger } from './server/utils/logger';
import { errorHandler } from './server/middleware/errorHandler';
import { rateLimiter } from './server/middleware/rateLimiter';

// Route imports
import healthRoutes from './server/modules/health/health.routes';
import analyticsRoutes from './server/modules/analytics/analytics.routes';
import problemsRoutes from './server/modules/problems/problems.routes';
import universitiesRoutes from './server/modules/universities/universities.routes';
import industryRoutes from './server/modules/industry/industry.routes';
import proposalsRoutes from './server/modules/proposals/proposals.routes';
import aiRoutes from './server/modules/ai/ai.routes';
import discussionsRoutes from './server/modules/discussions/discussions.routes';
import authRoutes from './server/modules/auth/auth.routes';
import notificationsRoutes from './server/modules/notifications/notifications.routes';
import mediaRoutes from './server/modules/media/media.routes';
import verificationRoutes from './server/modules/verification/verification.routes';
import { setupSwagger } from './server/utils/swagger';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Set development mode for prototype testing (bypasses auth middleware)
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  app.use(express.json({
    limit: '20mb',
    verify: (req, _res, buffer) => {
      if (req.url === '/api/auth/verify-sheerid') {
        (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
      }
    },
  }));

  // Rate limiting on API routes
  app.use('/api', rateLimiter({ windowMs: 60_000, maxRequests: 200 }));

  // --- API Routes ---
  app.use('/api/health', healthRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/problems', problemsRoutes);
  app.use('/api/universities', universitiesRoutes);
  app.use('/api/industry', industryRoutes);
  app.use('/api/proposals', proposalsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/discussions', discussionsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/verification', verificationRoutes);

  // Swagger Documentation
  setupSwagger(app);

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Global error handler (must be registered AFTER all routes)
  app.use(errorHandler);

  // Vite middleware for development or static serving for production
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
    logger.info(`Jharkhand Societal Innovation Portal running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error('Fatal server startup error:', err);
  process.exit(1);
});
