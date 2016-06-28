# Compose Middleware

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Compose an array of middleware into a single function for use in Express, Connect, router, etc.

## Installation

```sh
npm install compose-middleware --save
```

## Usage

Compose multiple middleware functions into a single request middleware handler, with support for inline error handling middleware.

```js
var express = require('express')
var compose = require('compose-middleware').compose

var app = express()

app.use(compose([
  function (req, res, next) {},
  function (err, req, res, next) {},
  function (req, res, next) {}
]))
```

**P.S.** The composed function takes three arguments. Express.js (and Connect, router) only accept error handlers of four arguments. If you want to return an error handler from `compose` instead, try the `errors` export - it works exactly the same, but exposes the four argument middleware pattern.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/compose-middleware.svg?style=flat
[npm-url]: https://npmjs.org/package/compose-middleware
[downloads-image]: https://img.shields.io/npm/dm/compose-middleware.svg?style=flat
[downloads-url]: https://npmjs.org/package/compose-middleware
[travis-image]: https://img.shields.io/travis/blakeembrey/compose-middleware.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/compose-middleware
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/compose-middleware.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/compose-middleware?branch=master
