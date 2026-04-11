import mongoose from "mongoose";

const globalForMongoose = globalThis;

if (!globalForMongoose.__mongooseCache) {
  globalForMongoose.__mongooseCache = {
    conn: null,
    promise: null
  };
}

export async function connectToDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Add it to your .env file.");
  }

  if (globalForMongoose.__mongooseCache.conn) {
    return globalForMongoose.__mongooseCache.conn;
  }

  if (!globalForMongoose.__mongooseCache.promise) {
    globalForMongoose.__mongooseCache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false
    });
  }

  globalForMongoose.__mongooseCache.conn = await globalForMongoose.__mongooseCache.promise;
  return globalForMongoose.__mongooseCache.conn;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export function isDatabaseUnavailableError(error) {
  const message = String(error?.message || "");

  return (
    error?.name === "MongooseServerSelectionError" ||
    message.includes("ECONNREFUSED") ||
    message.includes("server selection") ||
    message.includes("connect ECONNREFUSED")
  );
}
