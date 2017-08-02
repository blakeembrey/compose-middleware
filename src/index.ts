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

      const handler = stack[pos]

      function next (err?: Error) {
        if (pos < index) {
          throw new TypeError('`next()` called multiple times')
        }

        return dispatch(pos + 1, err)
      }

      try {
        if (handler.length === 4) {
          if (err) {
            log('handle(err)', (handler as any).name || '<anonymous>')

            return (handler as ErrorHandler)(err, req, res, next)
          }
        } else {
          if (!err) {
            log('handle()', (handler as any).name || '<anonymous>')

            return (handler as RequestHandler)(req, res, next)
          }
        }
      } catch (e) {
        // Avoid future errors that could diverge stack execution.
        if (index > pos) throw e

        log('try..catch', e)

        return next(e)
      }

      return next(err)
    }

    return dispatch(0, err)
  }
}
