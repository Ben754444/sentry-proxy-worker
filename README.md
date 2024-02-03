# Cloudflare Workers Sentry Proxy

A dead simple Cloudflare Worker to proxy requests to Sentry to prevent them from being blocked by a browser adblocker.

The Cloudflare worker should ideally be mounted on the domain used by your application. This should prevent any CORS issues. For example, if your site is https://example.com, the worker should be mounted on something like https://example.com/error-reporting-proxy.

This is only required on client/frontend applications.

## Usage

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Ben754444/sentry-proxy-worker)

To get started, click the button above or deploy this worker using whatever method you prefer. 

### Route

Next, you need to add a route to your worker to cover each application you want to proxy. Head to `Triggers`, then `Routes`. Your route should look something like this:

`myapp.example.com/error-reporting-proxy/*`

You can rename `error-reporting-proxy` to whatever you want, just make sure your application doesn't use the same path, as all requests to that path will be proxied.

### Sentry Init

Finally, change the following in your application where you initialise Sentry:

```javascript
Sentry.init({
  dsn: "<your_DSN_key>",
  integrations: [new Sentry.BrowserTracing(), Sentry.replayIntegration()],

  tracesSampleRate: 1.0,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  //!!!! important bit (remember trailing slash) !!!!
  tunnel: "/error-reporting-proxy/",
});
```

If that's all you're looking for, you're done! I've included a few extra options below, but they probably aren't necessary.

## Strict mode

Strict mode is a feature that will only allow specific DSNs to be proxied. This is useful if you want to make sure that only your applications are using the proxy. It's highly unlikely that anyone is going to do this, especially considering CORS will make it inviable, but it's here if you want it.

To enable strict mode, add your DSNs to the `ALLOWED_DSN` environment variable, separated by a comma. For example:

```
ALLOWED_DSN=https://dsn1,https://dsn2
```

*(you can add environment variables in the settings tab of your worker)*

Remember to update the environment variable if you add a new application/DSN.

## Self-hosted Sentry

If you have a fancy self-hosted Sentry instance or a custom URL, you can set the `SENTRY_INGEST_DOMAIN` environment variable to your Sentry domain. For example:

```
SENTRY_INGEST_DOMAIN=sentry.example.com
```

This is set to `ingest.sentry.io` by default to prevent aritrary requests to any URL.


### \<script> setup

If you are using the `<script>` tag to include Sentry, you can change the URL from `https://js.sentry-cdn.com/` to the following to prevent the browser from blocking the request:

```html
<script src="/error-reporting-proxy/<your dsn>.min.js" crossorigin="anonymous"></script>
```