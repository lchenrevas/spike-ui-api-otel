import type { Context } from "../context";

export type Result<T> = {
  value?: T;
  error?: Error;
};

export type AuthRequest = {
  state: string;
  codeVerifier: string;
  redirectUrl: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expireTimeUnix?: number;
};

// TODO do we need a new oidc context or will we use the more generic auth context?
// TODO will we pass the following configurations from main?
const authContextKey = "oidc__request";
const authSessionContextKey = "oidc__session";

export const getAuthRequest: (
  context: Context,
) => Promise<Result<AuthRequest>> = async (context) => {
  const result = await context.getValue<AuthRequest>(authContextKey);
  if (result.error) {
    return {
      error: result.error,
    };
  }
  return {
    value: result.value,
  };
};

export const setAuthRequest: (
  context: Context,
  request: AuthRequest,
) => Promise<Result<void>> = async (context, request) => {
  const result = await context.setValue(authContextKey, request);
  if (result.error) {
    return {
      error: result.error,
    };
  }
  return {};
};

export const getAuthSession: (
  context: Context,
) => Promise<Result<AuthSession>> = async (context) => {
  const result = await context.getValue<AuthSession>(authSessionContextKey);
  if (result.error) {
    return {
      error: result.error,
    };
  }
  return {
    value: result.value,
  };
};

export const setAuthSession: (
  context: Context,
  session: AuthSession,
) => Promise<Result<void>> = async (context, session) => {
  const result = await context.setValue(authSessionContextKey, session);
  if (result.error) {
    return {
      error: result.error,
    };
  }
  return {};
};
