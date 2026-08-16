import { describe, expect, it } from "vitest";
import { writeToolDefinitions } from "./write";
describe("write tool definitions", () => {
  it("marks every write as confirmation-required", () => expect(Object.values(writeToolDefinitions).every((tool) => tool.kind === "write" && tool.requiresConfirmation)).toBe(true));
  it("validates ownership inputs", () => expect(writeToolDefinitions.createOwnershipChangeRequest.inputSchema.safeParse({ accountNumber: "123", currentHolder: "Anterior", newHolder: "Nuevo" }).success).toBe(true));
  it("rejects incomplete ownership inputs", () => expect(writeToolDefinitions.createOwnershipChangeRequest.inputSchema.safeParse({ accountNumber: "123" }).success).toBe(false));
});
