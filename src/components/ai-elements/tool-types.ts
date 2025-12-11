import type { ToolUIPart } from "ai";

// The upstream ToolUIPart["state"] type does not yet include approval states.
// We extend it locally to match the actual runtime values used by this app.
export type ToolState =
  | ToolUIPart["state"]
  | "approval-requested"
  | "approval-responded"
  | "output-denied";

