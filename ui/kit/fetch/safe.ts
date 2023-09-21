import type { ZodType } from "zod";
import { z } from "zod";

export type Result<T> = {
  value?: T;
  error?: Error;
};

const errorSchema = z.object({
  code: z.number(),
  message: z.string(),
});
export type Error = z.infer<typeof errorSchema>;

const errorResponseSchema = z.object({
  error: errorSchema,
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const defaultErrorSchema = errorResponseSchema;

export enum Code {
  Ok = 0,
  Cancelled = 1,
  Unknown = 2,
  InvalidArgument = 3,
  DeadlineExceeded = 4,
  NotFound = 5,
  AlreadyExist = 6,
  PermissionDenied = 7,
  Unauthenticated = 16,
  ResourceExhausted = 8,
  FailedPrecondition = 9,
  Aborted = 10,
  OutOfRange = 11,
  Unimplemented = 12,
  Internal = 13,
  Unavailable = 14,
  DataLoss = 15,
}

type Fetch = typeof fetch;

export type SafeFetch<T> = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Result<T>>;

export function newTypedFetch<T>(
  fetch: Fetch,
  schema: ZodType<T>,
): SafeFetch<T> {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    return schemaSafeFetchAsync(fetch, input, init, schema);
  };
}

export async function errorSafeFetchAsync(
  fetch: Fetch,
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
): Promise<Result<Response>> {
  try {
    const response = await fetch(input, init);
    if (response.status < 400) {
      return {
        value: response,
      };
    }
    // infrastructure or application error.
    const body = await response.json();
    // check if body is a valid/supported application error.
    const parsed = errorResponseSchema.safeParse(body);
    if (parsed.success) {
      return {
        error: parsed.data.error,
      };
    }
    // error: request was successful but an error code was returned.
    return {
      error: {
        code: Code.Unknown,
        message: JSON.stringify(body),
      },
    };
  } catch (e: any) {
    // error: request was unsuccessful.
    return {
      error: {
        code: Code.Unknown,
        message: e.toString(),
      },
    };
  }
}

export async function schemaSafeFetchAsync<T>(
  fetch: Fetch,
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
  schema?: ZodType<T> | undefined,
): Promise<Result<T>> {
  const { value, error } = await errorSafeFetchAsync(fetch, input, init);
  if (error != null) {
    return {
      error: error,
    };
  }
  // response by safeFetch contract cannot be null.
  const body = await value?.json();
  if (schema == null) {
    return {
      value: body,
    };
  }
  // check if response is a valid json object from schema.
  const parsed = schema.safeParse(body);
  if (parsed.success) {
    return {
      value: parsed.data,
    };
  }
  // error: schema contract is invalid.
  return {
    error: {
      code: Code.Unknown,
      message: JSON.stringify(body),
    },
  };
}
