import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { closeRedisClient } from "@/utils/redisClient";

let mongo: MongoMemoryServer | undefined;


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
      await collections[key].deleteMany({});
    }
  }
}
