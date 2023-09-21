import type { Context } from "../context";
import { setAuthSession, type AuthRequest, type AuthSession } from "./context";

import * as oauth2 from "oauth4webapi";

type Result<T> = {
  value?: T;
  error?: Error;
};

interface AuthorizeOptions {
  redirectUrl: string;
}

export function createState(): () => string {
  return oauth2.generateRandomState;
}

export function createCodeVerifier(): () => string {
  return oauth2.generateRandomCodeVerifier;
}

export function createCodeChallenge(): (
  codeVerifier: string,
) => Promise<string> {
  return oauth2.calculatePKCECodeChallenge;
}

export type AuthorizeFunction = (
  context: Context,
  options: AuthorizeOptions,
) => Promise<Result<string>>;

export type ExchangeFunction = (
  context: Context,
  url: URL,
) => Promise<Result<string>>;

export const createAuthorizeFunction: (
  authorizationEndpoint: string,
  clientId: string,
  clientSecret: string,
  audience: string,
  redirectUri: string,
  createState: () => string,
  createCodeVerifier: () => string,
  createCodeChallenge: (codeVerifier: string) => Promise<string>,
  setAuthRequest: (
    context: Context,
    request: AuthRequest,
  ) => Promise<Result<void>>,
) => AuthorizeFunction = (
  authorizationEndpoint,
  clientId,
  clientSecret,
  audience,
  redirectUri,
  createState,
  createCodeVerifier,
  createCodeChallenge,
  setAuthRequest,
) => {
  return async (context, options) => {
    const state = createState();
    const codeVerifier = createCodeVerifier();
    const codeChallenge = await createCodeChallenge(codeVerifier);

    const u = new URL(authorizationEndpoint);
    u.searchParams.set("state", state);
    u.searchParams.set("client_id", clientId);
    u.searchParams.set("client_secret", clientSecret);
    u.searchParams.set("code_challenge", codeChallenge);
    u.searchParams.set("code_challenge_method", "S256");
    u.searchParams.set("redirect_uri", redirectUri);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("scope", "openid email offline");
    u.searchParams.set("audience", audience);

    const result = await setAuthRequest(context, {
      state: state,
      codeVerifier: codeVerifier,
      redirectUrl: options.redirectUrl,
    });
    if (result.error) {
      return {
        error: result.error,
      };
    }

    return {
      value: u.toString(),
    };
  };
};

export const createExchangeFunction: (
  issuer: string,
  tokenEndpoint: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  getAuthRequest: (context: Context) => Promise<Result<AuthRequest>>,
) => ExchangeFunction = (
  issuer,
  tokenEndpoint,
  clientId,
  clientSecret,
  redirectUri,
  getAuthRequest,
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

  return async (context, url) => {
    const authorizeRequestResult = await getAuthRequest(context);
    if (authorizeRequestResult.error) {
      return {
        error: authorizeRequestResult.error,
      };
    }
    const authorizeRequest = authorizeRequestResult.value!;

    const params = oauth2.validateAuthResponse(
      server,
      client,
      url,
      authorizeRequest.state,
    );
    if (oauth2.isOAuth2Error(params)) {
      return {
        error: new Error(params.error),
      };
    }

    const response = await oauth2.authorizationCodeGrantRequest(
      server,
      client,
      params,
      redirectUri,
      authorizeRequest.codeVerifier,
    );
    const result = await oauth2.processAuthorizationCodeOpenIDResponse(
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

    const authSessionResult = await setAuthSession(
      context,
      processTokenResult.value!,
    );
    if (authSessionResult.error) {
      return {
        error: authSessionResult.error,
      };
    }
    return {
      value: authorizeRequest.redirectUrl,
    };
  };
};

export const processToken: (
  tokenResult: oauth2.TokenEndpointResponse,
  currentSession?: AuthSession | undefined,
) => Promise<Result<AuthSession>> = async (tokenResult, currentSession) => {
  const clockSkew = 300; // 5 minutes of skew. Invalidate before.
  let expireTimeUnix: number | undefined = undefined;
  if (tokenResult.expires_in) {
    const expiresIn = tokenResult.expires_in - clockSkew; // seconds
    expireTimeUnix = new Date().getSeconds() + expiresIn;
  }
  const authSession: AuthSession = {
    accessToken: tokenResult.access_token,
    expireTimeUnix: expireTimeUnix,
    refreshToken: tokenResult.refresh_token,
  };
  return {
    value: authSession,
  };
};
