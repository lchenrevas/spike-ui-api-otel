# spike-ui-api-otel

curl -X POST 'http://localhost:8080/GetMessage/' \
--data-raw '{
    "message": {
        "value": "Luisa"
    }
}' | json_pp


## UI

1. Setup the following env variables:

```sh
OTEL_EXPORTER_OTLP_HEADERS # this is a key value list of headers ex. OTEL_EXPORTER_OTLP_HEADERS="x-honeycomb-team=<API_KEY>,Authorization=Basic%20<API_KEY>"
OTEL_TRACES_EXPORTER #defaults is "otlp"
OTEL_EXPORTER_OTLP_ENDPOINT
OTEL_SERVICE_NAME
```

2. From a terminal inside the `ui/remix2-example` run the following commands:

> If it's your first time using the app, remember to run `npm i` both in `ui/remix2-example` and `ui/kit`

Build command:
```sh
npm run build
```

Start command:
```sh
npm run start
```

3. The app will run by default on port 3000, so you can try the app going to `http://locahost:3000`