/* eslint-disable no-console */
const express = require('express');
const next = require('next');

// const API_URL = 'http://server:8081';
const API_URL = process.env.SERVER_URL || 'http://localhost:8081';

const devProxy = {
  '/api': {
    target: `${API_URL}`,
    // pathRewrite: { '^/api': '/' },
    // changeOrigin: true,
  },
  '/graphql': {
    target: `${API_URL}/graphql`,
    ws: true, // proxy websockets
    logLevel: 'debug',
    // pathRewrite: { '^/graphql': '/' },
    changeOrigin: true,
  },
};

const port = parseInt(process.env.PORT, 10) || 3000;
const env = process.env.NODE_ENV;
const dev = env !== 'production';
const app = next({
  dir: '.', // base directory where everything is, could move to src later
  dev,
});

const handle = app.getRequestHandler();

let server;
app
  .prepare()
  .then(() => {
    server = express();

    // Set up the proxy.
    if (dev && devProxy) {
      console.log(`====================setting up the proxy`);
      const proxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;
      Object.keys(devProxy).forEach(function (context) {
        server.use(proxyMiddleware(context, devProxy[context]));
      });
    }

    // Default catch-all handler to allow Next.js to handle all other routes
    server.all('*', (req, res) => handle(req, res));

    server.listen(port, (err) => {
      if (err) {
        throw err;
      }
      console.log(`> Ready on port ${port} [${env}]`);
    });

  })
  .catch((err) => {
    console.log('An error occurred, unable to start the server');
    console.log(err);
  });