import debug = require('debug')

const log = debug('compose-middleware')

export type Next<T = void> = (err?: Error | null) => T
export type RequestHandler <T, U, V = void> = (req: T, res: U, next: Next<V>) => V
export type ErrorHandler <T, U, V = void> = (err: Error | null, req: T, res: U, next: Next<V>) => V
export type Middleware <T, U, V = void> = RequestHandler<T, U, V> | ErrorHandler<T, U, V>

/**
 * Compose a variadic number of middlewares into a single middleware.
 */
export function compose <T, U, V = void> (
  middleware?: RequestHandler<T, U, V>,
  ...middlewares: Middleware<T, U, V>[]
): RequestHandler<T, U, V>
export function compose <T, U, V = void> (
  middleware: ErrorHandler<T, U, V>,
  ...middlewares: Middleware<T, U, V>[]
): ErrorHandler<T, U, V>
export function compose <T, U, V = void> (
  middleware?: Middleware<T, U, V>,
  ...middlewares: Middleware<T, U, V>[]
): Middleware <T, U, V> {
  if (!middleware) {
    return successes<T, U, V>()
  } else if (middleware.length === 3) {
    return successes<T, U, V>(middleware as RequestHandler<T, U, V>, ...middlewares)
  }
  return errors<T, U, V>(middleware as ErrorHandler<T, U, V>, ...middlewares)
}

/**
 * Compose a variadic number of middlewares into a single success middleware.
 */
export function successes <T, U, V = void> (...middlewares: Middleware<T, U, V>[]): RequestHandler<T, U, V> {
  const middleware = generate(middlewares)

  return (req: T, res: U, done: Next<V>) => middleware(null, req, res, done)
}

/**
 * Compose a variadic number of middlewares into a single error middleware.
 */
export function errors <T, U, V = void> (...middlewares: Middleware<T, U, V>[]): ErrorHandler<T, U, V> {
  return generate(middlewares)
}

/**
 * Generate a composed middleware function.
 */
function generate <T, U, V = void> (middlewares: Array<Middleware<T, U, V>>) {
  for (const middleware of middlewares) {
    if (typeof middleware as any !== 'function') {
      throw new TypeError('Handlers must be a function')
    }
  }

  return function middleware (err: Error | null, req: T, res: U, done: Next<V>): V {
    let index = -1

    function dispatch (pos: number, err?: Error | null): V {
      const middleware = middlewares[pos]

      index = pos

      if (index === middlewares.length) return done(err)

      function next (err?: Error | null) {
        if (pos < index) {
          throw new TypeError('`next()` called multiple times')
        }

        return dispatch(pos + 1, err)
      }

      try {
        if (middleware.length === 4) {
          if (err) {
            log('handle(err)', (middleware as any).name || '<anonymous>')

            return (middleware as ErrorHandler<T, U, V>)(err, req, res, next)
          }
        } else {
          if (!err) {
            log('handle()', (middleware as any).name || '<anonymous>')

            return (middleware as RequestHandler<T, U, V>)(req, res, next)
          }
        }
      } catch (e) {
        // Avoid future errors that could diverge middlewares execution.
        if (index > pos) throw e

        log('try..catch', e)

        return next(e)
      }

      return next(err)
    }

    return dispatch(0, err)
  }
}
