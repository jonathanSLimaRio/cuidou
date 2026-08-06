import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseBoundedInt, parseJsonBody, parsePagination } from "../request";

describe("request parsing", () => {
  it("bounds pagination and integer inputs", () => {
    expect(parsePagination(new URLSearchParams("page=2&pageSize=999"), { defaultPageSize: 10, maxPageSize: 50 })).toEqual({ page: 2, pageSize: 50 });
    expect(parsePagination(new URLSearchParams("page=-2&pageSize=nope"), { defaultPageSize: 10, maxPageSize: 50 })).toEqual({ page: 1, pageSize: 10 });
    expect(parseBoundedInt("100", 5, 20)).toBe(20);
    expect(parseBoundedInt(null, 5, 20)).toBe(5);
  });

  it("returns typed data and categorized client errors", async () => {
    const schema = z.object({ name: z.string().min(2) });
    await expect(parseJsonBody(new Request("http://test", { method: "POST", body: '{"name":"Ana"}' }), schema)).resolves.toEqual({ data: { name: "Ana" } });
    const invalid = await parseJsonBody(new Request("http://test", { method: "POST", body: '{"name":""}' }), schema);
    expect("response" in invalid && invalid.response?.status).toBe(422);
    const malformed = await parseJsonBody(new Request("http://test", { method: "POST", body: "{" }), schema);
    expect("response" in malformed && malformed.response?.status).toBe(400);
  });
});
