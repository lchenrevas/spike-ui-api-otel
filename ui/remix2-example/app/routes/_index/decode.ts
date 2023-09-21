import type { DecodeRequestFunction } from "kit/http";
import type { LoaderRequest } from "./loader";

export const decodeLoaderRequest: DecodeRequestFunction<LoaderRequest> = (
  context,
  request,
  params,
) => {
  const u = new URL(request.url);
  return Promise.resolve({
    value: {
      who: u.searchParams.get("who") || "",
    },
  });
};

// type ActionRequest = {
//   who: string;
// }

// export const decodeActionRequest: DecodeRequestFunction<ActionRequest> = (session: any, args: DataFunctionArgs) => {

// }
