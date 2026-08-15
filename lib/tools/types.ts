import type { z } from "zod";
import type { JourneyContext } from "../journey/types";

export type ToolResult<T> = { ok: true; data: T } | { ok: false; error: "invalid_input" | "unavailable" };
export type ReadOnlyTool<TSchema extends z.ZodType, TOutput> = {
  name: string;
  description: string;
  inputSchema: TSchema;
  execute: (input: z.infer<TSchema>, context: JourneyContext) => Promise<ToolResult<TOutput>>;
};
