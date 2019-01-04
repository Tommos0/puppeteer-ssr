const puppeteer = require('puppeteer');
const express = require('express');
const request = require('request');

function parseBoolStr(boolStr, defaultValue) {
  return boolStr ? boolStr === 'true' : defaultValue;
}

const PROXY_URL = process.env.PSSR_PROXY_URL || 'http://localhost:3000';
const BROWSER_REFRESH_RATE = process.env.PSSR_BROWSER_REFRESH_RATE || 60000;
const BROWSER_COOLDOWN_TIME = process.env.PSSR_BROWSER_COOLDOWN_TIME || 10000;
const PORT_NUMBER = process.env.PSSR_PORT_NUMBER ? parseInt(process.env.PSSR_PORT_NUMBER) : 8001;
const WHITELIST_REGEXP = new RegExp(process.env.PSSR_WHITELIST_REGEXP || "^/$");
const BLACKLIST_REGEXP = new RegExp(process.env.PSSR_BLACKLIST_REGEXP || "^/static/.*");

const LOG_WARNINGS = parseBoolStr(process.env.PSSR_LOG_WARNINGS, true);
const LOG_INFO     = parseBoolStr(process.env.PSSR_LOG_INFO, true);
const LOG_DEBUG    = parseBoolStr(process.env.PSSR_LOG_DEBUG, false);

const info = LOG_INFO     ? console.log : () => null;
const debug = LOG_DEBUG   ? console.log : () => null;
const warn = LOG_WARNINGS ? console.warn : () => null;

let currentBrowser;

async function ssr(url) {
  try {
    debug(`Opening ${url} in browser.`);
    const page = await currentBrowser.newPage();
    await page.goto(url, {waitUntil: 'networkidle2'});
    const content = await page.content();
    page.close();
    return content;
  } catch(e) {
    info(`Error while waiting for ${url} to go idle. (${e.message})`);
  }
}

async function closeBrowser(browser) {
  await new Promise(resolve => setTimeout(resolve, BROWSER_COOLDOWN_TIME));
  const nOpenPages = (await browser.pages()).length - 1;
  if (nOpenPages > 0) {
    info(`Closing old browser with ${nOpenPages} open pages.`);
  }
  return browser.close();
}

async function refreshBrowser() {
  debug('Refreshing browser.');
  const oldBrowser = currentBrowser;
  // currentBrowser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  currentBrowser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
  // currentBrowser = await puppeteer.launch({headless: true});
  if (oldBrowser) {
    await closeBrowser(oldBrowser);
  }
}

async function handleRequest (req, res) {
  debug('Incoming request for ' + req.originalUrl);
  const url = PROXY_URL + req.originalUrl;
  if (WHITELIST_REGEXP.test(req.originalUrl) && !BLACKLIST_REGEXP.test(req.originalUrl)) {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(await ssr(url));
  } else {
    request.get(url).pipe(res);
  }
}

async function init() {
  info('Starting.');
  info(`Proxied URL: ${PROXY_URL}`);
  await refreshBrowser();
  setInterval(refreshBrowser, BROWSER_REFRESH_RATE);
  info(`Browser started, starting server.`);
  const app = express();
  app.get("/*", handleRequest);
  app.listen( PORT_NUMBER, () => {
    info(`Now listening on port ${PORT_NUMBER}.`);
  } );
}

init();
