import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route modules
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// Build allowed origins list for CORS
// - Local development: Vite dev server default ports
// - Production: the deployed Vercel frontend. The browser always calls the API
//   through the Vercel "/api" rewrite (see vercel.json), so the API only ever
//   sees Vercel origins in production.
// - Extra origins: the FRONTEND_URL env var accepts a comma-separated list and
//   simple "*" wildcards, e.g.
//   FRONTEND_URL="https://shop.example.com,https://*.vercel.app"
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://megabasketgro.vercel.app',
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => allowedOrigins.push(origin));
}

// Match an origin against the allow-list. Entries may contain "*" wildcards.
const matchesAllowedOrigin = (origin) =>
  allowedOrigins.some((allowed) => {
    if (allowed === origin) return true;
    if (!allowed.includes('*')) return false;
    const pattern = allowed
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${pattern}$`).test(origin);
  });

// Vercel preview deployments of this project use origins like
// megabasketgro-git-<branch>-<scope>.vercel.app. They reach the API through the
// same "/api" rewrite as production, so allow the project's own domains without
// needing a dashboard change for every preview URL.
const isProjectVercelOrigin = (origin) => {
  try {
    const { protocol, hostname, port } = new URL(origin);
    return (
      protocol === 'https:' &&
      !port &&
      hostname.endsWith('.vercel.app') &&
      /^megabasketgro(-|\.)/i.test(hostname)
    );
  } catch {
    return false;
  }
};

// Enable CORS with origin whitelist
// Note: origin '*' with credentials:true is invalid per CORS spec.
// We use a function-based origin to reflect only allowed origins,
// and handle requests with no Origin header (server-to-server, health checks).
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, health checks, server-to-server)
      if (!origin) return callback(null, true);
      if (matchesAllowedOrigin(origin) || isProjectVercelOrigin(origin)) {
        return callback(null, true);
      }
      // Deny unknown origins by simply omitting the CORS headers. Throwing here
      // (the previous behaviour) turned every disallowed origin into a 500
      // "Internal Server Error", which made a wrong FRONTEND_URL look like a
      // crashed API instead of a browser CORS block.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'MegaBasket API',
    time: new Date().toISOString(),
  });
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
