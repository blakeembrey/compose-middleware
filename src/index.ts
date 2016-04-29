import flatten = require('array-flatten')

export type Callback = (err?: Error) => any
export type RequestMiddleware = (req?: any, res?: any, next?: Callback) => any
export type ErrorMiddleware = (err?: Error, req?: any, res?: any, next?: Callback) => any
export type Middleware = RequestMiddleware | ErrorMiddleware

export type MiddlewareHandlers = Middleware | flatten.NestedArray<Middleware>

export function compose (...handlers: MiddlewareHandlers[]): RequestMiddleware {
  const stack = flatten<Middleware>(handlers)

  for (const handler of stack) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handlers must be a function')
    }
  }

  return function middleware (req: any, res: any, done: Callback) {
    let index = 0

    function next (err?: Error): void {
      if (index === stack.length) {
        return done(err)
      }

      const handler = stack[index++]

      if (handler.length === 4) {
        if (err) {
          (<ErrorMiddleware> handler)(err, req, res, next)
        } else {
          next(err)
        }
      } else {
        if (err) {
          next(err)
        } else {
          (<RequestMiddleware> handler)(req, res, next)
        }
      }
    }

    next()
  }
}
