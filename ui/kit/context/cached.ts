import type { ResponseInit } from ".";
import type { Context, ContextStorage } from ".";

type ContextWrapper = (ctx: Context) => CachedContext;
type ContextStorageWrapper = (storage: ContextStorage) => ContextStorage;

interface CachedContext extends Context {
  getContext(): Context;
}

export const createContextStorageCache: () => ContextStorageWrapper = () => {
  return (storage) => {
    return {
      decodeContext: async (request: Request) => {
        const result = await storage.decodeContext(request);
        if (result.error) {
          return {
            error: result.error,
          };
        }
        const cache = createContextCache();
        return {
          value: cache(result.value!),
        };
      },
      encodeContext: (context: Context, init: ResponseInit) => {
        const ctx = (context as CachedContext).getContext();
        return storage.encodeContext(ctx, init);
      },
    };
  };
};

const createContextCache: () => ContextWrapper = () => {
  const cache = new Map<string, any>();
  return (ctx) => {
    return {
      setValue: async <R>(name: string, value: R) => {
        const result = await ctx.setValue(name, value);
        if (result.error) {
          return {
            error: result.error,
          };
        }
        cache.set(name, value);
        return result;
      },
      getValue: async (name: string) => {
        const value = cache.get(name);
        if (value) {
          return {
            value: value,
          };
        }
        return await ctx.getValue(name);
      },
      getContext() {
        return ctx;
      },
    };
  };
};
