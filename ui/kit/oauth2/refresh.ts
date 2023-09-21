import { Context } from "../context";
import { processToken } from "./authorize";
import { AuthSession, Result } from "./context";

import * as oauth2 from "oauth4webapi";

export type RefreshFunction = (
  context: Context,
) => Promise<Result<AuthSession>>;

export const createRefreshFunction: (
  issuer: string,
  tokenEndpoint: string,
  clientId: string,
  clientSecret: string,
  getAuthSession: (context: Context) => Promise<Result<AuthSession>>,
  setAuthSession: (
    context: Context,
    session: AuthSession,
  ) => Promise<Result<void>>,
) => RefreshFunction = (
  issuer,
  tokenEndpoint,
  clientId,
  clientSecret,
  getAuthSession,
  setAuthSession,
) => {
  const server: oauth2.AuthorizationServer = {
    issuer: issuer,
    token_endpoint: tokenEndpoint,
  };
  const client: oauth2.Client = {
    client_id: clientId,
    client_secret: clientSecret,
    token_endpoint_auth_method: "client_secret_basic",
  };

  return async (context) => {
    const sessionResult = await getAuthSession(context);
    if (sessionResult.error) {
      return {
        error: sessionResult.error,
      };
    }
    const session = sessionResult.value!;
    if (!session.refreshToken) {
      return {
        error: new Error("no refresh token in session."),
      };
    }
    const response = await oauth2.refreshTokenGrantRequest(
      server,
      client,
      session.refreshToken,
    );
    const result = await oauth2.processRefreshTokenResponse(
      server,
      client,
      response,
    );
    if (oauth2.isOAuth2Error(result)) {
      return {
        error: new Error(result.error),
      };
    }

    const processTokenResult = await processToken(result);
    if (processTokenResult.error) {
      return {
        error: processTokenResult.error,
      };
    }
    const refreshSession = processTokenResult.value!;
    session.accessToken = refreshSession.accessToken;
    session.expireTimeUnix = refreshSession.expireTimeUnix;
    if (refreshSession.refreshToken) {
      session.refreshToken = refreshSession.refreshToken;
    }

    const authSessionResult = await setAuthSession(context, session);
    if (authSessionResult.error) {
      return {
        error: authSessionResult.error,
      };
    }
    return {
      value: session,
    };
  };
};
