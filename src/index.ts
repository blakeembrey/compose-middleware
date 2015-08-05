import flatten = require('array-flatten')

export type Middleware = (req: any, res: any, next: (err?: Error) => any) => any

export function compose (handlers: Middleware[]): Middleware {
  var stack = flatten(handlers)

  // Quick exit.
  if (handlers.length < 2) {
    return handlers[0]
  }

  return function middleware (req, res, done) {
    var index = 0

    function next (err?: Error): void {
      if (err) {
        return done(err)
      }

      if (index === handlers.length) {
        return done()
      }

      var handler = handlers[index++]

      return handler(req, res, next)
    }

    next()
  }
}
