/**
 * Side-effect module: loads .env files via @next/env before anything else
 * runs. Imported at the very top of server.ts so modules like prisma.ts
 * (which read process.env at import time) see the variables.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
