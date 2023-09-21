import { SeverityNumber } from "@opentelemetry/api-logs";
import type {
  DecodeRequestFunctionMiddleware,
  EncodeResponseFunctionMiddleware,
} from ".";
import { logger, tracer } from "./telemetry";
import { SpanStatusCode } from "@opentelemetry/api";

export const newSameOriginMiddleware: () => DecodeRequestFunctionMiddleware =
  () => {
    return (next) => {
      return async (context, request, params) => {
        return tracer.startActiveSpan(
          "redirect_error_encoder",
          async (span) => {
            let csrf = false;
            // CSRF; check Sec-Fetch-Site header.
            const fetchSite = request.headers.get("Sec-Fetch-Site");
            if (fetchSite !== "same-origin" && fetchSite !== "none") {
              csrf = true;
            }
            // TODO CSRF; check Referral header.
            // TODO CSRF; check Origin header.
            if (csrf) {
              logger.emit({
                severityNumber: SeverityNumber.ERROR4,
                severityText: "CRITICAL",
                body: "malicious_csrf",
              });
              span.recordException("malicious_csrf");
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: "malicious_csrf",
              });
              // TODO: return error and block request
              //span.end();
            }
            const result = await next(context, request, params);
            span.end();
            return result;
          },
        );
      };
    };
  };

export const newSecurityHeaderMiddleware: () => EncodeResponseFunctionMiddleware =
  () => {
    return (next) => {
      return (context, response, init) => {
        const headers = new Headers(init?.headers || {});
        headers.set("Referrer-Policy", "no-referrer");
        init.headers = headers;
        return next(context, response, init);
      };
    };
  };
