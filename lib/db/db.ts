import { connect, connection, Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deliver4me';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: Connection | null;
  promise: Promise<typeof import('mongoose')> | null;
}

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

let cached: MongooseCache = globalWithMongoose.mongoose || {
  conn: null,
  promise: null,
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached;
}

export async function dbConnect(): Promise<Connection> {
  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = connect(MONGODB_URI, opts)
      .then((mongoose) => {
        return mongoose;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  try {
    const mongooseInstance = await cached.promise;
    cached.conn = mongooseInstance.connection;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}


process.on('SIGINT', async () => {
  if (cached.conn) {
    await cached.conn.close();
    console.log('Mongoose connection closed');
  }
  process.exit(0);
});

export { connection };