import mongoose from 'mongoose';
import net from 'net';

let mongoMemoryServerInstance = null;

const isProduction = () => process.env.NODE_ENV === 'production';

// A URI is treated as "local" when it is empty or points at a local daemon on
// the default port. Only local URIs may use the development in-memory MongoDB.
const isLocalMongoUri = (uri) =>
  !uri ||
  uri.includes('localhost:27017') ||
  uri.includes('127.0.0.1:27017');

const isLocalPortListening = (port = 27017, host = '127.0.0.1', timeout = 400) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

// The embedded, in-memory MongoDB is a DEVELOPMENT convenience only:
// - `mongodb-memory-server` lives in devDependencies, and production installs
//   (npm install with NODE_ENV=production) deliberately skip devDependencies,
//   so importing it throws ERR_MODULE_NOT_FOUND;
// - it downloads a MongoDB binary on first use;
// - its data is discarded on every restart.
// A production deployment must therefore never fall back to it.
const startEmbeddedMongoDB = async () => {
  if (isProduction()) {
    throw new Error(
      'Embedded MongoDB is disabled in production. Set MONGODB_URI to a reachable MongoDB connection string (e.g. MongoDB Atlas).'
    );
  }
  if (mongoMemoryServerInstance) {
    return mongoMemoryServerInstance.getUri();
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongoMemoryServerInstance = await MongoMemoryServer.create();
  const uri = mongoMemoryServerInstance.getUri();
  console.log(`[Database] Embedded MongoDB running at ${uri}`);
  return uri;
};

export const connectDB = async () => {
  try {
    let mongoUri = (process.env.MONGODB_URI || '').trim();
    const isLocalhostUri = isLocalMongoUri(mongoUri);

    // In production there is no embedded fallback, so a missing/local URI is a
    // configuration error that must be reported instead of silently papered over.
    if (isLocalhostUri && isProduction()) {
      throw new Error(
        'MONGODB_URI is missing or points at localhost in production. Set it to your MongoDB connection string (e.g. MongoDB Atlas).'
      );
    }

    if (isLocalhostUri) {
      // Fast probe to check if a local standalone MongoDB daemon is running
      const isListening = await isLocalPortListening(27017);
      if (!isListening) {
        console.log(
          '[Database] No active daemon on port 27017. Initializing embedded in-memory MongoDB...'
        );
        mongoUri = await startEmbeddedMongoDB();
      }
    }

    if (!mongoUri || mongoUri.trim() === '') {
      mongoUri = await startEmbeddedMongoDB();
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] Connected to MongoDB (${conn.connection.host})`);
    return conn;
  } catch (error) {
    // Production: never fall back to an in-memory database (it would discard
    // data on every restart). Report the real error; server.js keeps the HTTP
    // port open so the deployment is still detected as healthy.
    if (isProduction()) {
      console.error(`[Database] Connection failed: ${error.message}`);
      throw error;
    }

    console.warn(`[Database] Connection warning (${error.message}). Activating fallback instance...`);
    try {
      const fallbackUri = await startEmbeddedMongoDB();
      const conn = await mongoose.connect(fallbackUri);
      console.log(`[Database] Connected to fallback MongoDB (${fallbackUri})`);
      return conn;
    } catch (fallbackError) {
      console.error('[Database] Failed to initialize fallback MongoDB:', fallbackError.message);
      throw fallbackError;
    }
  }
};

/**
 * Current MongoDB connection state, reported by the /api/health endpoint so a
 * deployment can be verified without reading the logs.
 */
export const getDbStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const state = mongoose.connection.readyState;
  return states[state] || 'unknown';
};

export const closeDB = async () => {
  await mongoose.connection.close();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
};

export default connectDB;
