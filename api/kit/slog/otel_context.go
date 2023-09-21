package slog

import (
	"context"

	"log/slog"

	"go.opentelemetry.io/otel/trace"
)

func traceID(ctx context.Context) (string, bool) {
	span := trace.SpanFromContext(ctx)
	if span.SpanContext().IsValid() {
		traceID := span.SpanContext().TraceID().String()
		return traceID, true
	}
	return "", false
}

func TraceContextFunc(ctx context.Context) []slog.Attr {
	id, ok := traceID(ctx)
	if !ok {
		return []slog.Attr{}
	}
	return []slog.Attr{slog.String("trace_id", id)}
}
