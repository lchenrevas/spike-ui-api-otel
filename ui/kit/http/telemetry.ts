import { trace } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
export const tracer = trace.getTracer("github.com/revas-hq/ts-kit/http");
export const logger = logs.getLogger("github.com/revas-hq/ts-kit/http");
