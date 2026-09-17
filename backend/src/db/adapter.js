const fs = require('fs');
const initSqlJs = require('sql.js');
const { dataDirectory, databaseFile } = require('../config/env');
const { initSchemaIfNeeded } = require('./schema');

let sqliteDb = null;

function normalizeParams(params) {
  return params.map((value) => (value instanceof Date ? value.toISOString() : value));
}

function persistDatabase() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(databaseFile, Buffer.from(sqliteDb.export()));
}

function createDatabaseAdapter() {
  const execute = async (sql, params = []) => {
    const statement = sqliteDb.prepare(sql.replace(/INSERT\s+IGNORE/gi, 'INSERT OR IGNORE'));
    statement.bind(normalizeParams(params));
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    statement.free();

    if (/^\s*(SELECT|PRAGMA)/i.test(sql)) return [rows];

    const idResult = sqliteDb.exec('SELECT last_insert_rowid() AS id');
    const insertId = Number(idResult[0]?.values[0]?.[0] || 0);
    const affectedRows = sqliteDb.getRowsModified();
    persistDatabase();
    return [{ affectedRows, insertId }];
  };

  return { execute, query: execute };
}

async function connectDbOnce() {
  const SQL = await initSqlJs({
    locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
  });
  const savedDatabase = fs.existsSync(databaseFile)
    ? new Uint8Array(fs.readFileSync(databaseFile))
    : undefined;
  sqliteDb = savedDatabase ? new SQL.Database(savedDatabase) : new SQL.Database();
  const pool = createDatabaseAdapter();
  await initSchemaIfNeeded(pool);
  persistDatabase();
  return pool;
}

function isDbConnectionError(err) {
  return Boolean(
    err &&
      (err.code === 'ECONNREFUSED' ||
        err.code === 'ER_BAD_DB_ERROR' ||
        err.code === 'ER_ACCESS_DENIED_ERROR' ||
        err.code === 'PROTOCOL_CONNECTION_LOST')
  );
}

module.exports = { connectDbOnce, isDbConnectionError };
