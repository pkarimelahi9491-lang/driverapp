import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import driverRoutes from './modules/drivers/drivers.routes';
import locationRoutes from './modules/locations/locations.routes';
import routeRoutes from './modules/routes/routes.routes';
import tripRoutes from './modules/trips/trips.routes';
import dailyWorkRoutes from './modules/daily-work/dailyWork.routes';
import financeRoutes from './modules/finance/finance.routes';
import auditRoutes from './modules/audit/audit.routes';
import rosterRoutes from './modules/roster/roster.routes';

const app = express();

// ── Global Middleware ────────────────────────────────────────────────
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging (development) ───────────────────────────────────
if (config.nodeEnv === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Health Check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Arman Entekhab Fleet API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── API Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/daily-work', dailyWorkRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/roster', rosterRoutes);

// ── Static Files ────────────────────────────────────────────────────
// Development:
//   backend/src/app.ts
//   projectRoot = ../../
//
// Production Docker:
//   /app/dist/app.js
//   projectRoot = /app
const projectRoot =
  config.nodeEnv === 'production'
    ? path.resolve(__dirname, '..')
    : path.resolve(__dirname, '../..');

// Driver App — /driver/
const driverAppPath = path.join(projectRoot, 'driver-app');
app.use('/driver', express.static(driverAppPath));

// Web Admin — /admin/
const webAdminPath = path.join(projectRoot, 'web-admin-react', 'dist');
app.use('/admin', express.static(webAdminPath));

// ── Admin Panel SPA fallback ────────────────────────────────────────
app.get('/admin/*', (_req, res) => {
  res.sendFile(path.join(webAdminPath, 'index.html'));
});

// ── Root ────────────────────────────────────────────────────────────
// Open the admin panel when visiting the main domain.
app.get('/', (_req, res) => {
  res.redirect('/admin/');
});

// ── 404 Handler ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'مسیر مورد نظر یافت نشد', statusCode: 404 },
  });
});

// ── Global Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   Arman Entekhab Fleet Management API                    ║
║   Running on port ${config.port}                              ║
║   Environment: ${config.nodeEnv.padEnd(40)}  ║
║   Database: PostgreSQL                                   ║
║   Driver App: /driver/index.html                         ║
║   Admin Panel: /admin/                                   ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
