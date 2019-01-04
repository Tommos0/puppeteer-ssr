# puppeteer-ssr
Docker Puppeteer SSR (Server Side Rendering)

## What is this?
This software acts as a reverse proxy to a SPA (Single Page Application) so that it can be rendered server side. Why? Google and other indexing services cannot usually index SPA application since they are rendered on the client side (in the browser). Pre-rendering might also increase page load times.
This software can run as a proxy in front of your SPA and pre-render certain or all HTML pages so that the client (and thus also bots like Google's crawler), get served a full HTML page.

## How does it work?
There are several approaches to get SSR, including directly rendering using `node` (this can get tricky because of webpack configuration, typescript, etc.), or using an online service.
This software works by using [Puppeteer](https://github.com/GoogleChrome/puppeteer) to render pages in an actual browser, extract the generated html and return it to the requester.

## How to run it?
Easiest is to run the Docker image (it's rather large, ~1GB, because of the many dependencies of Chrome): [eyra/puppeteer-ssr](https://cloud.docker.com/u/eyra/repository/docker/eyra/puppeteer-ssr).
- E.g. `docker run -it -p 8001:8001 -e PSSR_PROXY_URL=https://single-spa.surge.sh -e PSSR_LOG_DEBUG=true eyra/puppeteer-ssr`.

## Configuration
Configuration is done through the environment:
- `PSSR_PROXY_URL`: The SPA base url to proxy, default `http://localhost:3000`.
- `PSSR_BROWSER_REFRESH_RATE`: Re-create chromium browser after every [x] milliseconds, to deal with possible chromium memory leaks, default `60000`
- `PSSR_BROWSER_COOLDOWN_TIME`: When a browser is scheduled to be closed, keep it open for [x] milliseconds to handle possible open longer running requests. default `10000`.
- `PSSR_PORT_NUMER`: The port number to listen on. Default `8001`.
- `PSSR_WHITELIST_REGEXP`: A regexp to mark which URLs should be SSR'ed. Default `^/$` (root URL only).
- `PSSR_BLACKLIST_REGEXP`: A regexp to mark which URLs should be not be SSR'ed. Default `^/static/.*` (directly proxy everything in /static/).
- `PSSR_LOG_WARNINGS`: Log warnings. Default `true`.
- `PSSR_LOG_INFO`: Log info. Default `true`.
- `PSSR_LOG_DEBUG`: Log debug info. Default `false`.

With respect to `PSSR_WHITELIST_REGEXP` and `PSSR_BLACKLIST_REGEXP`: a request will only be server-side rendered if it *matches the whitelist regexp and not the blacklist regexp*. 

## Caching
If the page loads are too slow, I suggest adding a cache like `nginx` or `varnish` as another proxy in front of this one.

## References
- https://developers.google.com/web/tools/puppeteer/articles/ssr
- https://medium.com/@baphemot/whats-server-side-rendering-and-do-i-need-it-cb42dc059b38
