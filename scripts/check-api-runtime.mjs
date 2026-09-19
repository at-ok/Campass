import { build } from "esbuild";
import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

// Preserve individual modules: bundling and tsx hide Node ESM import failures.
const entryPoints = [];
for (const directory of ["api", "server", "shared"]) {
  for (const file of await readdir(directory, { recursive: true })) {
    if (file.endsWith(".ts") && !/\.(test|spec|d)\.ts$/.test(file)) {
      entryPoints.push(`${directory}/${file}`);
    }
  }
}

await build({
  entryPoints,
  outbase: ".",
  outdir: "dist/api-runtime-check",
  bundle: false,
  platform: "node",
  format: "esm",
  target: "node22",
});

const result = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `
  import assert from 'node:assert/strict';
  const { default: handler } = await import('./dist/api-runtime-check/api/index.js');
  assert.equal(typeof handler, 'function');
  const { default: app } = await import('./dist/api-runtime-check/server/_core/app.js');
  const health = await app.request('https://campass.example.com/api/health');
  assert.equal(health.status, 200);
  assert.equal(await health.text(), 'Server is running');
  const session = await app.request('https://campass.example.com/api/auth/get-session');
  assert.equal(session.status, 200);
  assert.equal(await session.json(), null);
  const me = await app.request('https://campass.example.com/api/trpc/auth.me');
  assert.equal(me.status, 200);
  assert.equal((await me.json()).result.data.json, null);
  const { pool } = await import('./dist/api-runtime-check/server/db.js');
  await pool.end();
  console.log('Unbundled Node ESM: API entry, health, session and tRPC checks passed');
`,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
      BETTER_AUTH_URL: "https://campass.example.com",
      BETTER_AUTH_SECRET: "test-only-secret-for-runtime-check-0123456789",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    },
  }
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
