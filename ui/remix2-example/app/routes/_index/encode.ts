import { json } from "@remix-run/server-runtime";
import type { EncodeResponseFunction } from "kit/http";
import type { LoaderResponse } from "./loader";

export const encodeLoaderResponse: EncodeResponseFunction<LoaderResponse> = (
  context,
  res,
  init,
) => {
  return Promise.resolve({
    value: json(res, {
      headers: init.headers,
    }),
  });
};
