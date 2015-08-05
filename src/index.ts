import flatten = require('array-flatten')

export type Middleware = (req?: any, res?: any, next?: (err?: Error) => any) => any

export function compose (handlers: Middleware | Middleware[]): Middleware {
  if (typeof handlers === 'function') {
    return <Middleware> handlers
  }

  const stack = flatten(<Middleware[]> handlers)

  // Quick exit.
  if (handlers.length < 2) {
    return stack[0]
  }

  return function middleware (req, res, done) {
    let index = 0

    function next (err?: Error): void {
      if (err) {
        return done(err)
      }

      if (index === stack.length) {
        return done()
      }

      const handler = stack[index++]

      return handler(req, res, next)
    }

    next()
  }
}
