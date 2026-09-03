'use strict';

const mysql = require('mysql2/promise');

const password = process.env.DB_PASS || '';

if (!password && process.env.NODE_ENV === 'production') {
  console.error('Refusing to start: DB_PASS is empty in production. '
              + 'A blank MySQL root password exposes every patient record.');
  process.exit(1);
}
if (!password) {
  console.warn('DB password is empty (XAMPP default). Acceptable for a local '
             + 'demo only -- set DB_PASS before any shared deployment.');
}

/**
 * Aiven (and most managed MySQL) requires TLS.
 * Set DB_SSL=true and paste the CA PEM into DB_SSL_CA on Render.
 * Newlines in the env var may be stored as literal \n — we expand those.
 */
function buildSsl() {
  const flag = String(process.env.DB_SSL || '').toLowerCase();
  if (!flag || flag === '0' || flag === 'false' || flag === 'off') return undefined;

  const ssl = {};
  const ca = process.env.DB_SSL_CA || '';
  if (ca) ssl.ca = ca.includes('\\n') ? ca.replace(/\\n/g, '\n') : ca;

  if (String(process.env.DB_SSL_REJECT_UNAUTHORIZED || '').toLowerCase() === 'false') {
    ssl.rejectUnauthorized = false;
  }
  return ssl;
}

const ssl = buildSsl();
if (ssl) console.log('MySQL TLS enabled');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER || 'root',
  password,
  database: process.env.DB_NAME || 'diafact',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL || 10),
  queueLimit: 0,
  // Never let a caller-supplied string be interpreted as several statements.
  multipleStatements: false,
  charset: 'utf8mb4_general_ci',
  timezone: 'Z',
  ...(ssl ? { ssl } : {}),
});

module.exports = pool;
