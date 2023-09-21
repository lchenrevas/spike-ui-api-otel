import type { ContextFetchMiddleware } from "../fetch/chain";
import { tracer } from "./telemetry";
import { SpanStatusCode } from "@opentelemetry/api";
import { ContextTokenFunction } from "./token";

export const createAuthorizedFetch: (
  tokenSourceFunc: ContextTokenFunction,
) => ContextFetchMiddleware = (tokenSourceFunc) => {
  return (context) => {
    const tokenSource = tokenSourceFunc(context);
    return (next: typeof fetch) => {
      return async (input: RequestInfo | URL, init?: RequestInit) => {
        return tracer.startActiveSpan("authorize_fetch", async (span) => {
          const tokenResult = await tokenSource();
          if (tokenResult.error) {
            // We throw the error because we are implementing the fetch API.
            // Fetch API throws when something happens that prevents the
            // request or response to go through.
            span.recordException(tokenResult.error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: tokenResult.error.message,
            });
            span.end();
            throw tokenResult.error;
          }
          const headers = new Headers(init?.headers || {});
          headers.set(
            "Authorization",
            `${tokenResult.value!.tokenType} ${tokenResult.value!.accessToken}`,
          );
          init = { ...init, headers };
          const result = await next(input, init);
          span.end();
          return result;
        });
      };
    };
  };
};
