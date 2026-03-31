import request from "supertest";
import { app } from "@/app";

describe("Health Check", () => {
  it("should return 200 status for root endpoint", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
  });

  it("should return OpenAPI documentation at /document", async () => {
    const res = await request(app).get("/document");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("openapi");
    expect(res.body).toHaveProperty("info");
    expect(res.body.info).toHaveProperty("title", "URL Shortener API");
    expect(res.body.info).toHaveProperty("version", "1.0.0");
  });
});
