export * from "./cached";
export * from "./encrypt";
export * from "./prefix";

export type Result<T> = {
  value?: T;
  error?: Error;
};

export type ResponseInit = {
  headers?: Headers;
  status?: number;
  statusText?: string;
};

export interface ContextStorage {
  decodeContext(request: Request): Promise<Result<Context>>;
  encodeContext(context: Context, init: ResponseInit): Promise<Result<null>>;
}

export interface Context {
  setValue<R>(name: string, value: R): Promise<Result<null>>;
  getValue<R>(name: string): Promise<Result<R>>;
}

export const noopContext: Context = {
  async getValue(_name) {
    return {};
  },
  async setValue(_name, _value) {
    return {
      value: undefined,
    };
  },
};
