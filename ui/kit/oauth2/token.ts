import { RefreshFunction } from ".";
import { ContextTokenFunction } from "../auth";
import { AuthSession, getAuthSession } from "./context";

function isValid(session: AuthSession): boolean {
  if (session.expireTimeUnix) {
    return new Date().getSeconds() < session.expireTimeUnix;
  }
  return true;
}

export const createTokenSourceFunc: (
  refresh: RefreshFunction,
) => ContextTokenFunction = (refresh) => {
  return (context) => {
    return async () => {
      const sessionResult = await getAuthSession(context);
      if (sessionResult.error) {
        return {
          error: sessionResult.error,
        };
      }
      let session = sessionResult.value;
      if (!session) {
        return {
          error: new Error("no session"),
        };
      }
      if (!isValid(session)) {
        const refreshResult = await refresh(context);
        if (refreshResult.error) {
          return {
            error: refreshResult.error,
          };
        }
        session = refreshResult.value!;
      }
      return {
        value: {
          accessToken: session.accessToken,
          tokenType: "Bearer",
        },
      };
    };
  };
};
