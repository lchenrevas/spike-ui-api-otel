import { Context } from "../context";

export type ContextTokenFunction = (context: Context) => TokenFunction;

export type TokenFunction = () => Promise<Result>;

type Result = {
  value?: Token;
  error?: Error;
};

type Token = {
  accessToken: string;
  tokenType: string;
};
