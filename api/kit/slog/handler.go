package slog

import (
	"io"
	"path/filepath"

	"log/slog"
)

func replace(groups []string, a slog.Attr) slog.Attr {
	if a.Key == slog.SourceKey {
		source := a.Value.Any().(*slog.Source)
		source.File = filepath.Base(source.File)
	}
	if a.Key == slog.MessageKey {
		a.Key = "event"
	}
	return a
}

var (
	// https://opentelemetry.io/docs/specs/otel/logs/data-model/
	// https://pkg.go.dev/log/slog#Level
	LevelFatal = slog.Level(12)
)

func NewDefaultHandler(w io.Writer, options ...Option) slog.Handler {
	var h slog.Handler
	h = slog.NewTextHandler(w, &slog.HandlerOptions{
		AddSource:   true,
		ReplaceAttr: replace,
	})
	// SpanHandler should always be before NewTextHandler
	h = NewSpanHandler(h)

	for _, o := range options {
		h = o.apply(h)
	}

	return h
}
