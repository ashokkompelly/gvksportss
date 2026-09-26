import { AsyncLocalStorage } from 'node:async_hooks';

export const unavailable = () =>
  Object.assign(new Error('Online services are temporarily unavailable. Please try again later.'), {
    status: 503,
  });

export function connectionFailure(error) {
  return [
    'MongoNetworkError',
    'MongoNetworkTimeoutError',
    'MongoServerSelectionError',
    'MongoOperationTimeoutError',
  ].includes(error?.name);
}

// Never replay a write against a different database: its commit status may be unknown.
export function failoverStore(
  primary,
  fallback,
  { connect, prepare = async () => {}, retryMs = 30000 } = {},
) {
  let active = primary || fallback;
  let timer;
  let checking;
  let closed = false;
  const transactionContext = new AsyncLocalStorage();
  const schedule = () => {
    if (closed || active !== fallback || !connect || timer || checking) return;
    timer = setTimeout(() => {
      timer = null;
      void reconnect();
    }, retryMs);
    timer.unref?.();
  };
  const reconnect = () => {
    if (checking) return checking;
    if (closed || active !== fallback || !connect) return Promise.resolve();
    checking = (async () => {
      let candidate;
      try {
        candidate = primary || (await connect());
        await candidate.database.command({ ping: 1 });
        // Finish migrations and verify writable transactions before enabling login or writes.
        await prepare(candidate);
        if (closed) {
          if (candidate !== primary) await candidate.close();
          return;
        }
        primary = candidate;
        active = candidate;
        console.log('MongoDB connection restored. Online services are available again.');
      } catch {
        if (candidate && candidate !== primary) await candidate.close().catch(() => {});
        if (!closed)
          console.warn(
            'MongoDB is still unavailable; continuing SQLite content and retrying in the background.',
          );
      }
    })().finally(() => {
      checking = null;
      schedule();
    });
    return checking;
  };
  const switchToFallback = () => {
    if (active === fallback) return;
    active = fallback;
    console.warn(
      'MongoDB unavailable: serving the SQLite content snapshot while reconnecting in the background.',
    );
    schedule();
  };
  schedule();
  return new Proxy(
    {},
    {
      get(_, key) {
        if (key === 'backend') return active.backend;
        if (key === 'database' || key === 'client') return active[key];
        if (key === 'close')
          return async () => {
            closed = true;
            clearTimeout(timer);
            await checking;
            await primary?.close();
            await fallback.close();
          };
        if (key === 'switchToFallback') return switchToFallback;
        if (key === 'transaction')
          return async (fn) => {
            if (active === fallback) throw unavailable();
            try {
              const selected = primary;
              return await selected.transaction(() => transactionContext.run(selected, fn));
            } catch (error) {
              if (!connectionFailure(error)) throw error;
              switchToFallback();
              throw unavailable();
            }
          };
        if (['all', 'one', 'count', 'insert', 'update', 'remove'].includes(key))
          return async (...args) => {
            const reading = ['all', 'one', 'count'].includes(key);
            if (active === fallback && !reading) throw unavailable();
            try {
              const selected = transactionContext.getStore() || active;
              return await selected[key](...args);
            } catch (error) {
              if (!connectionFailure(error)) throw error;
              switchToFallback();
              if (!reading || transactionContext.getStore()) throw unavailable();
              return fallback[key](...args);
            }
          };
        return active[key];
      },
    },
  );
}
