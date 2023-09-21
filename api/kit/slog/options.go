package slog

import "log/slog"

type Option interface {
	apply(slog.Handler) slog.Handler
}

type option struct {
	optionFunc func(slog.Handler) slog.Handler
}

func (o *option) apply(s slog.Handler) slog.Handler {
	return o.optionFunc(s)
}

func optionFunc(f func(slog.Handler) slog.Handler) *option {
	return &option{f}
}

func WithContextFunc(contextFunc ContextFunc) Option {
	return optionFunc(func(h slog.Handler) slog.Handler {
		return NewContextHandler(contextFunc, h)
	})
}
