import { AsyncLocalStorage } from 'node:async_hooks';
import { tables } from './store.js';
const valid = (table) => {
  if (!tables.includes(table)) throw new Error('Unknown table');
  return table;
};
const field = (name) => {
  if (!/^[a-z_]+$/.test(name)) throw new Error('Invalid field');
  return name;
};
export function sqliteStore(db) {
  function where(filter, params) {
    return (
      Object.entries(filter)
        .map(([key, value]) => {
          if (key === '$or' || key === '$and')
            return (
              '(' +
              value.map((part) => where(part, params)).join(key === '$or' ? ' OR ' : ' AND ') +
              ')'
            );
          field(key);
          if (value === null) return `${key} IS NULL`;
          if (typeof value === 'object')
            return Object.entries(value)
              .map(([op, operand]) => {
                if (op === '$in') {
                  params.push(...operand);
                  return `${key} IN (${operand.map(() => '?').join(',')})`;
                }
                if (op === '$ne' && operand === null) return `${key} IS NOT NULL`;
                if (op === '$regex') {
                  params.push('%' + operand.replaceAll('\\', '') + '%');
                  return `${key} LIKE ?`;
                }
                const operator = {
                  $eq: '=',
                  $ne: '<>',
                  $gt: '>',
                  $gte: '>=',
                  $lt: '<',
                  $lte: '<=',
                }[op];
                if (!operator) throw new Error('Unsupported filter');
                params.push(operand);
                return `${key}${operator}?`;
              })
              .join(' AND ');
          params.push(value);
          return `${key}=?`;
        })
        .join(' AND ') || '1=1'
    );
  }
  // SQLite's connection is shared: queue complete async transactions.
  const context = new AsyncLocalStorage();
  let queue = Promise.resolve();
  async function access(fn) {
    if (!context.getStore()) await queue;
    return fn();
  }
  const store = {
    backend: 'sqlite',
    all(table, filter = {}, sort = {}, fields) {
      return access(() => {
        const params = [];
        const order = Object.entries(sort)
          .map(([k, v]) => `${field(k)} ${v === -1 ? 'DESC' : 'ASC'}`)
          .join(',');
        return db
          .prepare(
            `SELECT ${fields ? fields.map(field).join(',') : '*'} FROM ${valid(table)} WHERE ${where(filter, params)}${order ? ' ORDER BY ' + order : ''}`,
          )
          .all(...params);
      });
    },
    async one(table, filter = {}, fields) {
      return (await store.all(table, filter, {}, fields))[0];
    },
    count(table, filter = {}) {
      return access(() => {
        const params = [];
        return db
          .prepare(`SELECT count(*) AS n FROM ${valid(table)} WHERE ${where(filter, params)}`)
          .get(...params).n;
      });
    },
    insert(table, values) {
      return access(() => {
        const columns = Object.keys(values).map(field);
        return db
          .prepare(
            `INSERT INTO ${valid(table)}(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`,
          )
          .run(...Object.values(values));
      });
    },
    update(table, filter, values) {
      return access(() => {
        const params = Object.values(values);
        const set = Object.keys(values)
          .map((k) => `${field(k)}=?`)
          .join(',');
        return db
          .prepare(`UPDATE ${valid(table)} SET ${set} WHERE ${where(filter, params)}`)
          .run(...params);
      });
    },
    remove(table, filter) {
      return access(() => {
        const params = [];
        return db
          .prepare(`DELETE FROM ${valid(table)} WHERE ${where(filter, params)}`)
          .run(...params);
      });
    },
    async transaction(fn) {
      if (context.getStore()) return fn();
      const result = queue.then(() =>
        context.run(true, async () => {
          db.exec('BEGIN IMMEDIATE');
          try {
            const value = await fn();
            db.exec('COMMIT');
            return value;
          } catch (error) {
            db.exec('ROLLBACK');
            throw error;
          }
        }),
      );
      queue = result.catch(() => {});
      return result;
    },
    close: () => db.close(),
  };
  return store;
}
