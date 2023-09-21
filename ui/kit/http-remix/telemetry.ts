import { trace } from "@opentelemetry/api";
export const tracer = trace.getTracer("github.com/revas-hq/ts-kit/http-remix");
