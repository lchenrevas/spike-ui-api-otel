# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`


## TRACING with tracing.js
"start": "OTEL_SERVICE_NAME=remix2-example node --require ../kit/tracing/index.js ./node_modules/.bin/remix-serve ./build/index.js",

funziona con ./node_modules/.bin non con $(npm bin)


## TRACING auto
"start": "OTEL_SERVICE_NAME=remix2-example node --require @opentelemetry/auto-instrumentations-node/register ./node_modules/.bin/remix-serve ./build/index.js",