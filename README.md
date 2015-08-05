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

Mostly useful for third-party tooling that needs to generate a middleware function without the overhead of an array. You should probably just use an array.

```js
import express = require('express')
import { compose } from 'compose-middleware'

const app = express()

app.use(compose([
  function (req, res, next) {},
  function (req, res, next) {},
  function (req, res, next) {}
]))
```

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
