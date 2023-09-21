import { Context } from "../context";

export type Result<T> = {
  value?: T;
  error?: Error;
};

export type EndpointMiddleware = (
  next: Endpoint<any, any>,
) => Endpoint<any, any>;

export type Endpoint<ServiceRequest, ServiceResponse> = (
  context: Context,
  request: ServiceRequest,
) => Promise<Result<ServiceResponse>>;
