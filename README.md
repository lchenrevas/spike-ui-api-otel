# spike-ui-api-otel

curl -X POST 'http://localhost:8080/GetMessage/' \
--data-raw '{
    "message": {
        "value": "Luisa"
    }
}' | json_pp
