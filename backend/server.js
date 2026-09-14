import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './utils/seeder.js';

dotenv.config();

// Render (and other hosts) inject PORT. Fall back to 5001 for local use only.
const PORT = process.env.PORT || 5001;

// 1. Bind the port FIRST, before any database work.
//    Hosts detect an open port before they consider a deployment healthy, so
//    listening synchronously means a slow, misconfigured, or unreachable
//    MongoDB can never turn into "Port scan timeout reached, no open ports
//    detected". The API stays reachable and /api/health reports the database
//    state instead of the process exiting.
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`MegaBasket Backend running on http://0.0.0.0:${PORT}`);
});

// 2. Connect to MongoDB and seed afterwards. A failure is logged loudly but
//    must NOT kill the process: the port stays open, /api/health keeps
//    answering, and requests that need the database fail with a clear error.
const startDatabase = async () => {
  try {
    await connectDB();
    await seedDatabase();
  } catch (error) {
    console.error(
      `[Database] Startup failed: ${error.message}\n` +
        '  The API keeps running so the deployment stays healthy.\n' +
        '  Fix: set MONGODB_URI (and JWT_SECRET) in the host dashboard environment variables.'
    );
  }
};

startDatabase();

// Never let an unhandled rejection kill the listener in production.
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
});

export default server;
