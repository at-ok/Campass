import { handle } from "@hono/node-server/vercel";
import { attachDatabasePool } from "@vercel/functions";
import app from "../server/_core/app.js";
import { pool } from "../server/db.js";

attachDatabasePool(pool);

export default handle(app);
