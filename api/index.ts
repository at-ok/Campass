import { attachDatabasePool } from "@vercel/functions";
import app from "../server/_core/app.js";
import { pool } from "../server/db.js";

attachDatabasePool(pool);

// Web handlers preserve the request body without Node helper/body-parser conflicts.
export const GET = (request: Request) => app.fetch(request);
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const OPTIONS = GET;
export const HEAD = GET;
