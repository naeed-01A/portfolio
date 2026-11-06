// The site itself is plain static files served by Cloudflare. This tiny Worker exists for one reason:
// Cloudflare redirects every "/name.html" request to "/name", but Google Search Console needs its
// verification file at the exact ".html" address with a 200 response and no redirect.
// Only the path listed in wrangler.jsonc ("run_worker_first") ever reaches this code.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (/^\/google[0-9a-f]+\.html$/.test(url.pathname)) {
      // Fetch the same file without ".html" (served with 200) and send it back under the exact address.
      const file = await env.ASSETS.fetch(new Request(url.origin + url.pathname.slice(0, -5), request));
      return new Response(file.body, {
        status: file.status,
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
