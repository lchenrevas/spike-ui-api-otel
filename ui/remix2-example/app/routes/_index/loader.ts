import type { Endpoint } from "kit/endpoint";

export type LoaderRequest = {
  who: string;
};

export type LoaderResponse = {
  message: string;
};

export const newLoaderService: () => Endpoint<
  LoaderRequest,
  LoaderResponse
> = () => {
  return async (context, request) => {
    const messageFetchRes = await fetch('http://localhost:8080/GetMessage/', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          value: "Sam message"
        }
      }),
    })
    const res = await messageFetchRes.json()

    return {
      value: {
        message: res.message.value,
      },
    };
  };
};
