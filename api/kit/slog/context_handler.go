package slog

import (
	"context"
	"log/slog"
)

type ContextFunc func(ctx context.Context) []slog.Attr

type contextHandler struct {
	next        slog.Handler
	contextFunc ContextFunc
}

var _ slog.Handler = &contextHandler{}

func NewContextHandler(contextFunc ContextFunc, h slog.Handler) slog.Handler {
	return &contextHandler{
		next:        h,
		contextFunc: contextFunc,
	}
}

func (h *contextHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.next.Enabled(ctx, level)
}

func (h *contextHandler) Handle(ctx context.Context, record slog.Record) error {
	r := record.Clone()
	attrs := h.contextFunc(ctx)
	r.AddAttrs(attrs...)
	return h.next.Handle(ctx, r)
}

func (h *contextHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return NewContextHandler(h.contextFunc, h.next.WithAttrs(attrs))
}

func (h *contextHandler) WithGroup(name string) slog.Handler {
	return NewContextHandler(h.contextFunc, h.next.WithGroup(name))
}
