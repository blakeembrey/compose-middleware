import debug = require('debug')
import flatten = require('array-flatten')

const log = debug('compose-middleware')

export type PossibleError = null | undefined | Error
export type Next<T = void> = (err?: PossibleError) => T
export type RequestHandler <T, U, V = void> = (req: T, res: U, next: Next<V>) => V
export type ErrorHandler <T, U, V = void> = (err: Error, req: T, res: U, next: Next<V>) => V
export type Middleware <T, U, V = void> = RequestHandler<T, U, V> | ErrorHandler<T, U, V>

export type Handler <T, U, V = void> = Middleware<T, U, V> | flatten.NestedArray<Middleware<T, U, V>>

/**
 * Compose an array of middleware handlers into a single handler.
 */
export function compose <T, U, V = void> (...handlers: Handler<T, U, V>[]): RequestHandler<T, U, V> {
  const middleware = generate(handlers)

  return (req: T, res: U, done: Next<V>) => middleware(null, req, res, done)
}

/**
 * Wrap middleware handlers.
 */
export function errors <T, U, V = void> (...handlers: Handler<T, U, V>[]): ErrorHandler<T, U, V> {
  return generate(handlers)
}

/**
 * Generate a composed middleware function.
 */
function generate <T, U, V = void> (handlers: Array<Handler<T, U, V>>) {
  const stack = flatten<Middleware<T, U, V>>(handlers)

  for (const handler of stack) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handlers must be a function')
    }
  }

  return function middleware (err: PossibleError, req: T, res: U, done: Next<V>): V {
    let index = -1

    function dispatch (pos: number, err: PossibleError): V {
      const handler = stack[pos]

      index = pos

      if (index === stack.length) return done(err)

      function next (err?: PossibleError) {
        if (pos < index) {
          throw new TypeError('`next()` called multiple times')
        }

        return dispatch(pos + 1, err)
      }

      try {
        if (handler.length === 4) {
          if (err) {
            log('handle(err)', (handler as any).name || '<anonymous>')

            return (handler as ErrorHandler<T, U, V>)(err, req, res, next)
          }
        } else {
          if (!err) {
            log('handle()', (handler as any).name || '<anonymous>')

            return (handler as RequestHandler<T, U, V>)(req, res, next)
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
