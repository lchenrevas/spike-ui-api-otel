import type { ResponseInit, Result } from ".";
import type { Context, ContextStorage } from ".";

export interface PrefixedContextStorage extends ContextStorage {
  addStorage(prefix: string, storage: ContextStorage): void;
}

export interface PrefixedContext extends Context {
  getContext(prefix: string): Context;
}

export const createContextStorageMux: (
  defaultStorage: ContextStorage,
  sep: string,
) => PrefixedContextStorage = (defaultStorage, sep) => {
  const storages = new Map<string, ContextStorage>();
  storages.set("", defaultStorage);
  const storage: PrefixedContextStorage = {
    addStorage: function (prefix: string, storage: ContextStorage): void {
      storages.set(prefix, storage);
    },
    decodeContext: function (request: Request): Promise<Result<Context>> {
      return createPrefixedContext(storages, sep, request);
    },
    encodeContext: function (
      context: Context,
      init: ResponseInit,
    ): Promise<Result<null>> {
      return encodePrefixedContext(storages, context, init);
    },
  };
  return storage;
};

function extract(name: string, sep: string): [string, string] {
  const parts = name.split(sep);
  if (parts.length == 1) {
    return ["", parts[0]];
  }
  return [parts[0], parts[1]];
}

const createPrefixedContext: (
  storages: Map<string, ContextStorage>,
  sep: string,
  request: Request,
) => Promise<Result<Context>> = async (storages, sep, request) => {
  const ctxs = new Map<string, Context>();
  for (const [prefix, storage] of storages) {
    const tctx = await storage.decodeContext(request);
    if (tctx.error) {
      return {
        error: tctx.error,
      };
    }
    ctxs.set(prefix, tctx.value!);
  }
  const ctx: PrefixedContext = {
    setValue: function <R>(name: string, value: R): Promise<Result<null>> {
      const [prefix, suffix] = extract(name, sep);
      const c = ctxs.get(prefix);
      if (!c) {
        throw new Error(
          "context with invalid prefix found, not registered. prefix=" + prefix,
        );
      }
      return c.setValue(suffix, value);
    },
    getValue: function <R>(name: string): Promise<Result<R>> {
      const [prefix, suffix] = extract(name, sep);
      const c = ctxs.get(prefix);
      if (!c) {
        throw new Error(
          "context with invalid prefix found, not registered. prefix=" + prefix,
        );
      }
      return c.getValue(suffix);
    },
    getContext: function (prefix: string): Context {
      return ctxs.get(prefix)!;
    },
  };
  return {
    value: ctx,
  };
};

const encodePrefixedContext: (
  storages: Map<string, ContextStorage>,
  context: Context,
  init: ResponseInit,
) => Promise<Result<null>> = async (storages, context, init) => {
  const prefixedContext: PrefixedContext = context as PrefixedContext;
  for (const [prefix, storage] of storages) {
    const ctx = prefixedContext.getContext(prefix);
    const result = await storage.encodeContext(ctx, init);
    if (result.error) {
      return {
        error: result.error,
      };
    }
  }
  return {};
};
