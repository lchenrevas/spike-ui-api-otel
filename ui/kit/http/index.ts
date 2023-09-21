export * from "./security";
import type { Context } from "../context";

export type Result<T> = {
  value?: T;
  error?: Error;
};

export type DecodeRequestFunctionMiddleware = (
  next: DecodeRequestFunction<any>,
) => DecodeRequestFunction<any>;

export type DecodeRequestFunction<ServiceRequest> = (
  context: Context,
  request: Request,
  params: URLSearchParams,
) => Promise<Result<ServiceRequest>>;

export type EncodeResponseFunctionMiddleware = (
  next: EncodeResponseFunction<any>,
) => EncodeResponseFunction<any>;

export type EncodeResponseFunction<ServiceResponse> = (
  context: Context,
  response: ServiceResponse,
  init: ResponseInit,
) => Promise<Result<Response>>;

export type EncodeErrorFunctionMiddleware = (
  next: EncodeErrorFunction,
) => EncodeErrorFunction;

export type EncodeErrorFunction = (
  context: Context,
  error: Error,
  init: ResponseInit,
) => Promise<Response>;

export const panicEncodeError: EncodeErrorFunction = (
  _context,
  error,
  _init,
) => {
  throw error;
};

export const noopDecodeRequest: DecodeRequestFunction<undefined> = async (
  _context,
  _request,
  _params,
) => {
  return {
    value: undefined,
  };
};

export interface RedirectResponse {
  redirect: () => string | URL;
}

export const encodeRedirectResponse: EncodeResponseFunction<
  RedirectResponse
> = async (context, response, init: ResponseInit) => {
  // todo: check on runtime if response has redirect() function.
  const res = new Response(null, {
    status: 302,
    headers: init.headers,
  });
  res.headers.set("Location", response.redirect().toString());

  return {
    value: res,
  };
};
