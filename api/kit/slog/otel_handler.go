package slog

import (
	"context"

	"log/slog"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

type spanHandler struct {
	next slog.Handler
}

var _ slog.Handler = &spanHandler{}

func NewSpanHandler(h slog.Handler) slog.Handler {
	return &spanHandler{
		next: h,
	}
}

func (h *spanHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.next.Enabled(ctx, level)
}

func (h *spanHandler) Handle(ctx context.Context, record slog.Record) error {
	span := trace.SpanFromContext(ctx)
	attrs := []attribute.KeyValue{}
	record.Attrs(func(attr slog.Attr) bool {
		attrs = append(attrs, attribute.Stringer(attr.Key, attr.Value))
		return true
	})
	span.AddEvent(record.Message,
		trace.WithTimestamp(record.Time),
		trace.WithAttributes(attribute.String("level", record.Level.String())),
		trace.WithAttributes(attrs...))
	return h.next.Handle(ctx, record)
}

func (h *spanHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return NewSpanHandler(h.next.WithAttrs(attrs))
}

func (h *spanHandler) WithGroup(name string) slog.Handler {
	return NewSpanHandler(h.next.WithGroup(name))
}
