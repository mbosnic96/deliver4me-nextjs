"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
exports.dbConnect = dbConnect;
const mongoose_1 = require("mongoose");
Object.defineProperty(exports, "connection", { enumerable: true, get: function () { return mongoose_1.connection; } });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deliver4me';
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}
const globalWithMongoose = global;
let cached = globalWithMongoose.mongoose || {
    conn: null,
    promise: null,
};
if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = cached;
}
async function dbConnect() {
    if (cached.conn && cached.conn.readyState === 1) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxIdleTimeMS: 1000,
        };
        cached.promise = (0, mongoose_1.connect)(MONGODB_URI, opts)
            .then((mongoose) => {
            mongoose.set('debug', false);
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
    }
    catch (error) {
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
