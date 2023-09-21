import { EndpointMiddleware } from "../endpoint";
import { ContextTokenFunction } from ".";
import { EncodeErrorFunctionMiddleware, encodeRedirectResponse } from "../http";
import { tracer } from "./telemetry";
import { SpanStatusCode } from "@opentelemetry/api";

const foundStatusCode = 302;
export const unauthorizedError: Error = new Error("UNAUTHENTICATED");

export const createAuthorizeMiddleware: (
  tokenSourceFunc: ContextTokenFunction,
) => EndpointMiddleware = (tokenSourceFunc) => {
  return (next) => {
    return (context, request) => {
      return tracer.startActiveSpan("authorize_middleware", async (span) => {
        const tokenResult = await tokenSourceFunc(context)();
        if (tokenResult.error) {
          span.recordException(tokenResult.error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: tokenResult.error.message,
          });
          span.end();
          return {
            error: unauthorizedError,
          };
        }
        const result = next(context, request);
        span.end();
        return result;
      });
    };
  };
};

export const createRedirectErrorEncoderMiddleware: (
  url: string,
) => EncodeErrorFunctionMiddleware = (url) => {
  return (next) => {
    return async (context, error, init) => {
      return tracer.startActiveSpan("redirect_error_encoder", async (span) => {
        if (error === unauthorizedError) {
          const res = new Response(null, {
            status: foundStatusCode,
            headers: init.headers,
          });
          res.headers.set("Location", url);
          span.end();
          return res;
        }
        const result = await next(context, error, init);
        span.end();
        return result;
      });
    };
  };
};
