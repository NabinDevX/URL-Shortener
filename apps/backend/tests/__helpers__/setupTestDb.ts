import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { closeRedisClient } from "@/utils/redisClient";

let mongo: MongoMemoryServer | undefined;

process.env.USER_SECRET_ACCESS_TOKEN =
  "test_access_secret_key_for_testing_only";
process.env.USER_SECRET_REFRESH_TOKEN =
  "test_refresh_secret_key_for_testing_only";
process.env.ACCESS_TOKEN_EXPIRY = "1h";
process.env.REFRESH_TOKEN_EXPIRY = "7d";

export async function setupDb() {
  try {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
    await mongoose.connection.syncIndexes();
  } catch (error) {
    console.error("Failed to setup test database:", error);
    throw error;
  }
}

export async function teardownDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  await closeRedisClient();

  if (mongo) {
    await mongo.stop();
  }
}

export async function resetDb() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  }
}
