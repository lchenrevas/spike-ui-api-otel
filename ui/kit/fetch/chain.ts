import type { Context } from "../context";

export type FetchMiddleware = (next: typeof fetch) => typeof fetch;

export type ContextFetchMiddleware = (context: Context) => FetchMiddleware;

export type ContextFetchFunction = (context: Context) => typeof fetch;

// this is usually called only once in the main, reused for all requests.
// the FetchFactory is then passed to the service and invoked to get a valid fetch.
// this is required because some middlewares can only be built
// with the context to be effectivelu reused.
export const createContextFetch: (
  ...factories: ContextFetchMiddleware[]
) => ContextFetchFunction = (...factories) => {
  return (context) => {
    let f = fetch;
    for (let i = 0; i < factories.length; i++) {
      const factory = factories[i];
      const middleware = factory(context);
      f = middleware(f);
    }
    return f;
  };
};
