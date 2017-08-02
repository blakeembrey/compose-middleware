import debug = require('debug')
import flatten = require('array-flatten')

const log = debug('compose-middleware')

export type Callback = (err?: Error) => any
export type RequestHandler = (req?: any, res?: any, next?: Callback) => any
export type ErrorHandler = (err?: Error, req?: any, res?: any, next?: Callback) => any
export type Middleware = RequestHandler | ErrorHandler

export type Handler = Middleware | flatten.NestedArray<Middleware>

/**
 * Compose an array of middleware handlers into a single handler.
 */
export function compose (...handlers: Handler[]): RequestHandler {
  const middleware = errors(...handlers)

  return function (req: any, res: any, done: Callback) {
    return middleware(null, req, res, done)
  }
}

/**
 * Wrap middleware handlers.
 */
export function errors (...handlers: Handler[]): ErrorHandler {
  const stack = flatten<Middleware>(handlers)

  for (const handler of stack) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handlers must be a function')
    }
  }

  return function middleware (err: any, req: any, res: any, done: Callback) {
    let index = -1

    function dispatch (pos: number, err?: Error): void {
      index = pos

      if (index === stack.length) {
        return done(err)
      }

      return handle(stack[pos], err, req, res, function next (err?: Error) {
        if (pos < index) {
          throw new TypeError('`next()` called multiple times')
        }

        return dispatch(pos + 1, err)
      })
    }

    return dispatch(0, err)
  }
}

/**
 * Wrap middleware handling in a `try..catch` which forwards errors.
 */
function handle (handler: Middleware, err: Error, req: any, res: any, next: Callback) {
  log('handle', (handler as any).name || '<anonymous>')

  try {
    if (handler.length === 4) {
      if (err) {
        return (handler as ErrorHandler)(err, req, res, next)
      }

      return next(err)
    }

    if (err) {
      return next(err)
    }

    return (handler as RequestHandler)(req, res, next)
  } catch (err) {
    log('try..catch', err)

    return next(err)
  }
}
