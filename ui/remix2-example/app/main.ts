import {
  createCookieSessionStorage,
  type LoaderFunction,
} from "@remix-run/node";
import { createSessionContextStorage } from "kit/context-remix";
import { createContextStorageMux } from "kit/context";

import { createLoader } from "kit/http-remix";

import { decodeLoaderRequest } from "./routes/_index/decode";
import { encodeLoaderResponse } from "./routes/_index/encode";

import { type ServiceLocator, createContainer } from "kit/container";
import { createRedirectErrorEncoderMiddleware } from "kit/auth"

import { panicEncodeError } from "kit/http";
import { newLoaderService } from "./routes/_index/loader";

async function main(): Promise<ServiceLocator> {
  // 1. TODO: decode process args

  const isProd = process.env.NODE_ENV === "production";

  // 2. create all the context storages, like cookies and inmem storages.
  // kit provide wrappers for remix sessions.
  const defaultStorage = createSessionContextStorage(
    createCookieSessionStorage({
      cookie: {
        name: "default",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        maxAge: 31536000, // 1 year.
        secure: isProd,

        // If encryption is enabled, signing is not needed.
        // Using an empty string suppress the signing warning.
        secrets: [""],
      },
    }),
  );
  const authStorage = createSessionContextStorage(
    createCookieSessionStorage({
      cookie: {
        name: "auth",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        maxAge: 31536000, // 1 year.
        secure: isProd,

        // If encryption is enabled, signing is not needed.
        // Using an empty string suppress the signing warning.
        secrets: [""],
      },
    }),
  );

  // 3. when multiple storages are needed they can me multiplexed based on object key.
  const storageMux = createContextStorageMux(defaultStorage, "__");
  storageMux.addStorage("oidc", authStorage);

  // 4. the storage can be encrypted too using a Web Crypto key.
  // Use always AES-GCM encryption.
  // Use encyption when you want to hide cookies values from the user.
  // Mandatory if application have authentication.
  // const rawKey = new TextEncoder().encode("dksle8f7d6s52hsm");
  // const cryptoKey = await crypto.subtle.importKey(
  //   "raw",
  //   rawKey,
  //   "AES-GCM",
  //   true,
  //   ["encrypt", "decrypt"],
  // );
  // const contextStorage = createContextStorageEncrypter(cryptoKey)(storageMux);
  const contextStorage = storageMux

  // 5. authentication
  let indexService = newLoaderService();

  const errorMiddleware = createRedirectErrorEncoderMiddleware('/login')
  const errorEncoder = errorMiddleware(panicEncodeError)

  const _container = createContainer();

  _container.register<LoaderFunction>(
    "_index.loader",
    createLoader(
      indexService,
      decodeLoaderRequest,
      encodeLoaderResponse,
      contextStorage,
      errorEncoder
    ),
  );

  return _container;
}

export const container: () => Promise<ServiceLocator> = async () => {
  const g = global as any;
  g.__main ??= await main();
  return g.__main;
};
