import mongoose from "mongoose"

const mongodbUri = process.env.MONGODB_URI

if (!mongodbUri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

const MONGODB_URI: string = mongodbUri

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseConnectionCache: MongooseCache | undefined
}

const cached: MongooseCache =
  globalThis.mongooseConnectionCache ??
  (globalThis.mongooseConnectionCache = { conn: null, promise: null })

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => mongooseInstance)
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect
