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
export function failoverStore(primary, fallback) {
  let active = primary || fallback;
  const transactionContext = new AsyncLocalStorage();
  const switchToFallback = () => {
    if (active === fallback) return;
    active = fallback;
    console.warn(
      'MongoDB unavailable: serving the SQLite content snapshot. Online services are paused until restart.',
    );
  };
  return new Proxy(
    {},
    {
      get(_, key) {
        if (key === 'backend') return active.backend;
        if (key === 'database' || key === 'client') return active[key];
        if (key === 'close')
          return async () => {
            await primary?.close();
            await fallback.close();
          };
        if (key === 'switchToFallback') return switchToFallback;
        if (key === 'transaction')
          return async (fn) => {
            if (active === fallback) throw unavailable();
            try {
              return await primary.transaction(() => transactionContext.run(true, fn));
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
              return await active[key](...args);
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
