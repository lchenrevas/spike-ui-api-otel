import type { Session, SessionStorage } from "@remix-run/server-runtime";
import { ContextStorage } from "../context";

interface SessionContext {
  getSession(): Session | undefined;
}

export const createSessionContextStorage: (
  storage: SessionStorage,
) => ContextStorage = (storage) => {
  return {
    async decodeContext(request) {
      let pristine = true;
      const session = await storage.getSession(request.headers.get("cookie"));
      const ctx = {
        getSession() {
          if (pristine) {
            return undefined;
          }
          return session;
        },
        getValue(name: string) {
          const value = session.get(name);
          return Promise.resolve({
            value,
          });
        },
        setValue(name: string, value: any) {
          pristine = false;
          session.set(name, value);
          return Promise.resolve({});
        },
      };
      return {
        value: ctx,
      };
    },
    async encodeContext(context, init) {
      const sessionContext = context as unknown as SessionContext;
      const session = sessionContext.getSession();
      if (!session) {
        // pristine, no session to commit.
        return {};
      }
      const setCookie = await storage.commitSession(session);
      const headers = new Headers(init?.headers || {});
      headers.set("Set-Cookie", setCookie);
      init.headers = headers;
      return {};
    },
  };
};
