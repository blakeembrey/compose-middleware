// tslint:disable handle-callback-err

import { compose, Next, RequestHandler, ErrorHandler } from './index'
import { expect } from 'chai'

describe('compose middleware', () => {
  it('should noop with no middleware', (done) => {
    const middleware = compose()

    middleware({}, {}, done)
  })

  it('should validate all handlers are functions', () => {
    expect(() => compose('foo' as any)).to.throw(TypeError, 'Handlers must be a function')
  })

  it('should error when calling `next()` multiple times', (done) => {
    const middleware = compose<any, any>(
      function (req: any, res: any, next: Next) {
        next()
        next()
      }
    )

    try {
      middleware({}, {}, function () {/* */})
    } catch (err) {
      expect(err.message).to.equal('`next()` called multiple times')

      return done()
    }
  })

  describe('composing one middleware', () => {
    context('given a success handler', () => {
      context('that calls next without error', () => {
        it('behaves like middleware passed', (done) => {
          const middleware = compose(
            function (req: any, res: any, next: Next) {
              req.one = true
              next()
            }
          )

          const req: any = {}
          const res: any = {}

          middleware(req, res, function (err) {
            expect(err).to.equal(undefined)
            expect(req.one).to.equal(true)

            return done()
          })
        })
      })

      context('that calls next with error', () => {
        it('behaves like middleware passed', (done) => {
          const error = new Error('Boom!')
          const middleware = compose(
            function (req: any, res: any, next: Next) {
              req.one = true
              next(error)
            }
          )

          const req: any = {}
          const res: any = {}

          middleware(req, res, function (err) {
            expect(err).to.equal(error)
            expect(req.one).to.equal(true)

            return done()
          })
        })
      })

      context('that throws an error', () => {
        it('next callback collects the error thrown', (done) => {
          const error = new Error('Boom!')
          const middleware = compose(
            function (req: any, res: any, next: Next) {
              req.one = true
              throw error
              req.two = true
            }
          )

          const req: any = {}
          const res: any = {}

          middleware(req, res, function (err) {
            expect(err).to.equal(error)
            expect(req.one).to.equal(true)
            expect(req.two).to.equal(undefined)

            return done()
          })
        })
      })

      context('and does not call next', () => {
        it('middleware is called but next is not called', () => {
          const middleware = compose(
            function (req: any, res: any, next: Next) {
              req.one = true
            }
          )

          const req: any = {}
          const res: any = {}

          middleware(req, res, function (err) {
            expect.fail('next should not be called')
          })
          expect(req.one).to.equal(true)
        })
      })
    })

    context('given an error handler', () => {
      context('which is called with a null argument', () => {
        it('omits the middleware call but calls next', (done) => {
          const middleware = compose(
            function (err: Error | null, req: any, res: any, next: Next) {
              req.one = true
              next()
            }
          )

          const req: any = {}
          const res: any = {}

          middleware(null, req, res, function (err) {
            expect(err).to.equal(null)
            expect(req.one).to.equal(undefined)

            return done()
          })
        })
      })

      context('which is called with an error argument', () => {
        context('and calls next without error', () => {
          it('behaves like middleware passed', (done) => {
            const middleware = compose(
              function (err: Error | null, req: any, res: any, next: Next) {
                req.one = true
                next()
              }
            )

            const req: any = {}
            const res: any = {}
            const err: Error = new Error('Boom!')

            middleware(err, req, res, function (err) {
              expect(err).to.equal(undefined)
              expect(req.one).to.equal(true)

              return done()
            })
          })
        })

        context('and calls next with error', () => {
          it('middleware is called and next collect the error', (done) => {
            const error: Error = new Error('Boom!')
            const middleware = compose(
              function (err: Error | null, req: any, res: any, next: Next) {
                req.one = true
                next(error)
              }
            )

            const req: any = {}
            const res: any = {}
            const err: Error = new Error('Bang!')

            middleware(err, req, res, function (err) {
              expect(err).to.equal(error)
              expect(req.one).to.equal(true)

              return done()
            })
          })
        })

        context('and throws an error', () => {
          it('next callback collects the error thrown', (done) => {
            const error = new Error('Boom!')
            const middleware = compose(
              function (err: Error | null, req: any, res: any, next: Next) {
                req.one = true
                throw error
                req.two = true
              }
            )

            const req: any = {}
            const res: any = {}
            const err: Error = new Error('Pim!')

            middleware(err, req, res, function (err) {
              expect(err).to.equal(error)
              expect(req.one).to.equal(true)
              expect(req.two).to.equal(undefined)

              return done()
            })
          })
        })

        context('and does not call next', () => {
          it('middleware is called but next is not called', () => {
            const error = new Error('Boom!')
            const middleware = compose(
              function (err: Error | null, req: any, res: any, next: Next) {
                req.one = true
              }
            )

            const req: any = {}
            const res: any = {}
            const err: Error = new Error('Bang!')

            middleware(err, req, res, function (err) {
              expect.fail('next should not be called')
            })
            expect(req.one).to.be.equal(true)
          })
        })
      })
    })
  })

  describe('compose multiple middlewares', () => {
    context('composing success request handlers', () => {
      it('should call both middlewares', (done) => {
        const middleware = compose(
          function (req: any, res: any, next: Next) {
            req.one = true
            next()
          },
          function (req: any, res: any, next: Next) {
            req.two = true
            next()
          }
        )

        const req: any = {}
        const res: any = {}

        middleware(req, res, function (err) {
          expect(err).to.equal(undefined)
          expect(req.one).to.equal(true)
          expect(req.two).to.equal(true)

          return done()
        })
      })
    })

    context('first request handler propagate an error', () => {
      it('does not call second request handler and propagates the error', (done) => {
        const middleware = compose(
          function (req: any, res: any, next: Next) {
            req.one = true
            next(new Error('test'))
          },
          function (req: any, res: any, next: Next) {
            req.two = true
            next()
          }
        )

        const req: any = {}
        const res: any = {}

        middleware(req, res, function (err) {
          expect(err).instanceOf(Error)
          expect(req.one).to.equal(true)
          expect(req.two).to.equal(undefined)

          return done()
        })
      })
    })

    context('starting with a request handler', () => {
      it('should support error handlers', (done) => {
        const middleware = compose(
          function (req: any, res: any, next: Next) {
            return next(new Error('test'))
          },
          function (_: Error | null, req: any, res: any, next: Next) {
            return next()
          },
          function (req: any, res: any, next: Next) {
            req.success = true
            return next()
          },
          function (_: Error | null, req: any, res: any, next: Next) {
            req.fail = true
            return next()
          }
        )

        const req: any = {}

        middleware(req, {} as any, function (err) {
          expect(req.fail).to.equal(undefined)
          expect(req.success).to.equal(true)

          return done(err)
        })
      })
    })

    context('starting with a error handler', () => {
      it('creates an error handler', (done) => {
        const middleware = compose(
          function (err: Error | null, req: any, res: any, next: Next) {
            res.one = true
            return next(err)
          },
          function (req: any, res: any, next: Next) {
            res.two = true
            return next(new Error('test'))
          },
          function (err: Error | null, req: any, res: any, next: Next) {
            res.fail = err
            return next()
          },
          function (req: any, res: any, next: Next) {
            res.success = true
            return next()
          }
        )

        const res: any = {}
        const error: Error = new Error('Boom!')

        middleware(error, {} as any, res, function (err) {
          expect(res.one).to.equal(true)
          expect(res.two).to.equal(undefined)
          expect(res.fail).to.equal(error)
          expect(res.success).to.equal(true)
          expect(err).to.equal(undefined)

          return done()
        })
      })
    })
  })

  it('next callback should not cascade errors from `done()`', (done) => {
    const request = {
      done: 0,
      first: 0,
      second: 0,
      third: 0
    }

    const middleware = compose<typeof request, any>(
      function (req: typeof request, res: any, next: Next) {
        req.first++

        return next()
      },
      function (req: typeof request, res: any, next: Next) {
        req.second++

        throw new TypeError('Boom!')
      },
      function (req: typeof request, res: any, next: Next) {
        req.third++

        return next()
      }
    )

    try {
      middleware(request, {}, function () {
        request.done++

        throw new TypeError('This is the end')
      })
    } catch (err) {
      expect(request.done).to.equal(1)
      expect(request.first).to.equal(1)
      expect(request.second).to.equal(1)
      expect(request.third).to.equal(0)

      expect(err).instanceOf(TypeError)
      expect(err.message).to.equal('This is the end')

      return done()
    }

    return done(new TypeError('Missed thrown error'))
  })

  it('should avoid handling post-next thrown errors', function (done) {
    const middleware = compose<any, any>(
      function (req: any, res: any, next: Next) {
        return next()
      },
      function (req: any, res: any, next: Next) {
        next()
        throw new TypeError('Boom!')
      },
      function (req: any, res: any, next: Next) {
        return setTimeout(next)
      }
    )

    try {
      middleware({}, {}, function (err) {
        return done(err)
      })
    } catch (err) {
      expect(err).instanceOf(TypeError)
      expect(err.message).to.equal('Boom!')
      return
    }

    return done(new TypeError('Missed thrown error'))
  })

  it('should compose functions without all arguments', function (done) {
    const middleware = compose<any, any>(
      function (req: any, res: any, next: Next) {
        return next()
      },
      function () {
        return done()
      }
    )

    middleware({}, {}, function (err) {
      return done(err || new Error('Middleware should not have finished'))
    })
  })
})
