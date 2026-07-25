// Cloudflare Pages Function — reverse-proxies bankoninnovation.dev/api/* to the
// Render backend, so the browser only ever talks to one origin (no CORS setup
// needed, and client code keeps using a plain relative '/api' base URL).
//
// Set BACKEND_URL in the Cloudflare Pages project's environment variables,
// e.g. https://finlight-server.onrender.com (no trailing slash).
export async function onRequest(context) {
  const backendBase = context.env.BACKEND_URL;
  if (!backendBase) {
    return new Response('BACKEND_URL is not configured for this Pages project', { status: 500 });
  }

  const requestUrl = new URL(context.request.url);
  const targetUrl = backendBase + requestUrl.pathname + requestUrl.search;

  const proxiedRequest = new Request(targetUrl, context.request);
  return fetch(proxiedRequest);
}
