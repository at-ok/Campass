import { handle } from "@hono/node-server/vercel";
import { attachDatabasePool } from "@vercel/functions";
import app from "../server/_core/app";
import { pool } from "../server/db";

attachDatabasePool(pool);

export default handle(app);
