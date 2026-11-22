/**
 * incnet start file for shared hosting (cPanel "Setup Node.js App", Plesk, Hostinger, DirectAdmin...).
 * Set this as the app's startup file. It:
 *   1. reads settings from the host's environment variables, or from a .env file next to it;
 *   2. creates incnet's tables the first time it starts (from schema.sql);
 *   3. starts the incnet server on the port the host provides.
 */
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
process.env.NODE_ENV = 'production';
process.env.HOSTNAME = process.env.HOSTNAME && process.env.HOSTNAME !== 'localhost' ? process.env.HOSTNAME : '0.0.0.0';

async function prepareDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('incnet: DATABASE_URL is not set. Add it in your host\'s Node.js app settings or in .env.');
    return;
  }
  const { Client } = require('pg');
  const schema = process.env.DATABASE_SCHEMA || 'public';
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const { rows } = await client.query('select to_regclass($1) as t', [`"${schema}"."User"`]);
    if (rows[0].t) return; // already set up
    console.log(`incnet: creating tables in schema "${schema}"...`);
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8').replace(/CREATE SCHEMA IF NOT EXISTS "public";/, '');
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema.replace(/"/g, '')}"`);
    await client.query(`SET LOCAL search_path TO "${schema.replace(/"/g, '')}"`);
    await client.query(sql);
    await client.query('COMMIT');
    console.log('incnet: tables created.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('incnet: could not prepare the database:', err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

prepareDatabase().finally(() => require('./server.js'));
