import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import * as flags from "@/lib/flags";

// Node.js runtime required — flags/next uses node:async_hooks
export const runtime = "nodejs";

export const GET = createFlagsDiscoveryEndpoint(async () =>
	getProviderData(flags),
);
