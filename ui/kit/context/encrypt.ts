import type { ResponseInit } from ".";
import type { Context, ContextStorage } from ".";
import crypto from "crypto";

type Envelope = {
  ciphertext: string;
  iv: string;
};

type Result<R> = {
  value?: R;
  error?: Error;
};

function generateRandomIV() {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  return iv;
}

async function encrypt(key: CryptoKey, value: any): Promise<Result<Envelope>> {
  let encoded = new TextEncoder().encode(JSON.stringify(value));
  const iv = generateRandomIV();
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded,
  );

  const envelope: Envelope = {
    ciphertext: btoa(
      String.fromCharCode.apply(null, Array.from(new Uint8Array(ciphertext))),
    ),
    iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
  };

  return {
    value: envelope,
  };
}

async function decrypt(
  key: CryptoKey,
  envelope: Envelope,
): Promise<Result<any>> {
  const iv = new Uint8Array(
    Array.from(atob(envelope.iv), (c) => c.charCodeAt(0)),
  );
  const ciphertext = new Uint8Array(
    Array.from(atob(envelope.ciphertext), (c) => c.charCodeAt(0)),
  );

  const plaintextData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext,
  );

  const plaintext = new TextDecoder().decode(plaintextData);
  return {
    value: JSON.parse(plaintext),
  };
}

type ContextWrapper = (ctx: Context) => EncryptContext;
type ContextStorageWrapper = (storage: ContextStorage) => ContextStorage;

interface EncryptContext extends Context {
  getContext(): Context;
}

export const createContextStorageEncrypter: (
  key: CryptoKey,
) => ContextStorageWrapper = (key) => {
  const encrypter = createContextEncrypter(key);
  return (storage) => {
    return {
      decodeContext: async (request: Request) => {
        const result = await storage.decodeContext(request);
        if (result.error) {
          return {
            error: result.error,
          };
        }
        return {
          value: encrypter(result.value!),
        };
      },
      encodeContext: (context: Context, init: ResponseInit) => {
        const ctx = (context as EncryptContext).getContext();
        return storage.encodeContext(ctx, init);
      },
    };
  };
};

const createContextEncrypter: (key: CryptoKey) => ContextWrapper = (key) => {
  return (ctx) => {
    return {
      setValue: async <R>(name: string, value: R) => {
        const encryptResult = await encrypt(key, value);
        if (encryptResult.error) {
          return {
            error: encryptResult.error,
          };
        }
        return await ctx.setValue(name, encryptResult.value);
      },
      getValue: async (name: string) => {
        const result = await ctx.getValue<Envelope>(name);
        if (result.error) {
          return {
            error: result.error,
          };
        }
        if (!result.value) {
          return {
            value: undefined,
          };
        }
        const decryptResult = await decrypt(key, result.value!);
        if (decryptResult.error) {
          return {
            error: decryptResult.error,
          };
        }
        return {
          value: decryptResult.value,
        };
      },
      getContext() {
        return ctx;
      },
    };
  };
};
