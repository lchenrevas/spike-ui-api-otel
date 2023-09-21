import { Context, ContextStorage, noopContext } from "../context";
import {
  DecodeRequestFunction,
  EncodeErrorFunction,
  EncodeResponseFunction,
  panicEncodeError,
} from "../http";
import { Endpoint } from "../endpoint";

import { json, type DataFunctionArgs } from "@remix-run/server-runtime";

function mergeParams({ request, params }: DataFunctionArgs): URLSearchParams {
  const u = new URL(request.url);
  const q = u.searchParams;
  for (const key in params) {
    q.set(key, params[key]!);
  }
  return q;
}

export function createHandler<ServiceRequest, ServiceResponse>(
  service: Endpoint<ServiceRequest, ServiceResponse>,
  decodeRequest: DecodeRequestFunction<ServiceRequest>,
  encodeResponse: EncodeResponseFunction<ServiceResponse>,
  contextStorage?: ContextStorage,
  encodeError?: EncodeErrorFunction,
): (args: DataFunctionArgs) => Promise<Response> {
  const error = encodeError ? encodeError : panicEncodeError;
  return async (args) => {
    const params = mergeParams(args);
    const init = {
      headers: new Headers(),
    };
    let ctx: Context = noopContext;
    if (contextStorage) {
      const contextResult = await contextStorage.decodeContext(args.request);
      if (contextResult.error) {
        return error(ctx, contextResult.error, init);
      }
      ctx = contextResult.value!;
    }
    const decode = await decodeRequest(ctx, args.request, params);
    if (decode.error) {
      return error(ctx, decode.error, init);
    }
    const serviceResult = await service(ctx, decode.value!);
    if (serviceResult.error) {
      return error(ctx, serviceResult.error, init);
    }
    if (contextStorage) {
      const encodeContext = await contextStorage.encodeContext(ctx, init);
      if (encodeContext.error) {
        return error(ctx, encodeContext.error, init);
      }
    }
    const encodeResult = await encodeResponse(ctx, serviceResult.value!, init);
    if (encodeResult.error) {
      return error(ctx, encodeResult.error, init);
    }
    return encodeResult.value!;
  };
}

export const jsonEncodeResponse = <R>(
  _context: Context,
  response: R,
  init: ResponseInit,
) => {
  return json(response, init);
};

export const createLoader = createHandler;
export const createAction = createHandler;
