package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"log/slog"

	"github.com/go-kit/kit/endpoint"
	kitslog "github.com/lchenrevas/spike-ui-api-otel/kit/slog"
	"github.com/peterbourgon/ff"
	"go.opentelemetry.io/contrib/instrumentation/github.com/go-kit/kit/otelkit"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"

	kitendpoint "github.com/go-kit/kit/endpoint"
	kithttp "github.com/go-kit/kit/transport/http"
)

type Service interface {
	GetMessage(ctx context.Context, message *Message) error
}

type BaseService struct {
	Message string
}

type Message struct {
	Value string `json:"value"`
}

func (s BaseService) GetMessage(ctx context.Context, message *Message) error {
	message.Value = fmt.Sprintf("%s, Hello from API", message.Value)
	return nil
}

func main() {
	h := kitslog.NewDefaultHandler(
		os.Stdout,
		kitslog.WithContextFunc(kitslog.TraceContextFunc),
	)
	logger := slog.New(h)
	logger = logger.With("container", "test_ui_api_propagation")

	err := mainFunc(logger)
	if err != nil {
		log.Fatal(err)
	}
}

func mainFunc(logger *slog.Logger) error {
	fs := flag.NewFlagSet("test-ui-api-propagation", flag.ExitOnError)
	var (
		otelEndpoint    = fs.String("otel-endpoint", "", "")
		otelKey         = fs.String("otel-api-key", "", "")
		otelServiceName = fs.String("otel-service-name", "", "")
	)
	_ = ff.Parse(fs, os.Args[1:], ff.WithEnvVarPrefix("LCHEN_API"))
	ctx := context.Background()

	if *otelEndpoint != "" {
		c := otlptracegrpc.NewClient(
			otlptracegrpc.WithEndpoint(*otelEndpoint),
			otlptracegrpc.WithHeaders(map[string]string{
				"Authorization":    fmt.Sprintf("Basic %v", *otelKey),
				"x-honeycomb-team": fmt.Sprintf(*otelKey),
			}),
		)
		exporter, err := otlptrace.New(ctx, c)
		if err != nil {
			logger.Log(ctx, slog.LevelError, "server", "err", err)
		}
		defer exporter.Shutdown(ctx)
		tp := sdktrace.NewTracerProvider(
			sdktrace.WithSampler(sdktrace.AlwaysSample()),
			sdktrace.WithBatcher(exporter),
			sdktrace.WithResource(
				resource.NewWithAttributes(
					semconv.SchemaURL,
					semconv.ServiceNameKey.String(*otelServiceName),
				),
			),
		)
		otel.SetTracerProvider(tp)
		otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))
	}

	baseService := BaseService{}

	getMessageEndpoint := makeGetMessageEndpoint(baseService)
	getMessageEndpoint = otelkit.EndpointMiddleware(otelkit.WithOperation("get_message"))(getMessageEndpoint)
	baseEndpoints := Endpoints{
		GetMessageEndpoint: getMessageEndpoint,
	}

	baseHandler := NewGetMessageServer(ctx, baseEndpoints.GetMessageEndpoint, logger)

	mux := http.NewServeMux()
	mux.Handle("/GetMessage/", baseHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		logger.Log(ctx, slog.LevelInfo, "http_listen", "port", port)
	}
	httpServer := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	err := httpServer.ListenAndServe()
	if err != nil {
		logger.Log(ctx, slog.LevelError, "server", "err", err)
	}
	return nil
}

type Endpoints struct {
	GetMessageEndpoint endpoint.Endpoint
}

func makeGetMessageEndpoint(s Service) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(*GetMessageRequest)
		err := s.GetMessage(ctx, req.Message)
		if err != nil {
			return nil, err
		}
		return &GetMessageResponse{Message: req.Message}, nil
	}
}

type GetMessageRequest struct {
	Message *Message `json:"message"`
}

type GetMessageResponse struct {
	Message *Message `json:"message"`
	Err     error    `json:"error,omitempty"`
}

func encodeResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	return json.NewEncoder(w).Encode(response)
}

func NewGetMessageServer(ctx context.Context, endpoint kitendpoint.Endpoint, logger *slog.Logger, options ...kithttp.ServerOption) http.Handler {
	opts := []kithttp.ServerOption{}
	opts = append(opts, options...)
	var s http.Handler

	decode := func(_ context.Context, r *http.Request) (interface{}, error) {
		for key, values := range r.Header {
			for _, value := range values {
				logger.Log(ctx, slog.LevelInfo, "headers", "key", key, "value", value)
			}
		}

		var req GetMessageRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			return nil, err
		}
		return &req, nil
	}
	s = kithttp.NewServer(endpoint, decode, encodeResponse, opts...)
	return s
}
