import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("Database Connection", () => {
  let mongo: MongoMemoryServer;

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    if (mongo) {
      await mongo.stop();
    }
  });

  it("should establish connection successfully with valid URI", async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    process.env.MONGODB_URI = uri.replace(/\/[^/]*$/, "");
    process.env.DB_NAME = "test";

    const conn = await mongoose.connect(`${uri}test`);

    expect(conn).toBeDefined();
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("should have correct connection host after connecting", async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    await mongoose.connect(`${uri}test`);

    expect(mongoose.connection.host).toBeDefined();
    expect(typeof mongoose.connection.host).toBe("string");
  });

  it("should handle disconnection properly", async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    await mongoose.connect(`${uri}test`);
    expect(mongoose.connection.readyState).toBe(1);

    await mongoose.connection.close();
    expect(mongoose.connection.readyState).toBe(0);
  });
});
