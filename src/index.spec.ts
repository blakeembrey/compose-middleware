import { compose, Middleware, Callback } from './index'
import { expect } from 'chai'

describe('compose middleware', () => {
  it('should compose middleware', (done) => {
    const middleware = compose([
      function (req: any, res: any, next: Callback) {
        req.one = true
        next()
      },
      function (req: any, res: any, next: Callback) {
        req.two = true
        next()
      }
    ])

    const req: any = {}
    const res: any = {}

    middleware(req, res, function (err) {
      expect(err).to.equal(undefined)
      expect(req.one).to.equal(true)
      expect(req.two).to.equal(true)

      return done()
    })
  })

  it('should exit with an error', (done) => {
    const middleware = compose([
      function (req: any, res: any, next: Callback) {
        req.one = true
        next(new Error('test'))
      },
      function (req: any, res: any, next: Callback) {
        req.two = true
        next()
      }
    ])

    const req: any = {}
    const res: any = {}

    middleware(req, res, function (err) {
      expect(err).instanceOf(Error)
      expect(req.one).to.equal(true)
      expect(req.two).to.equal(undefined)

      return done()
    })
  })

  it('should short-cut handler with a single function', (done) => {
    const middleware = compose([
      function (req: any, res: any, next: Callback) {
        req.one = true
        next()
      }
    ])

    const req: any = {}
    const res: any = {}

    middleware(req, res, function (err) {
      expect(err).to.equal(undefined)
      expect(req.one).to.equal(true)

      return done()
    })
  })

  it('should accept a single function', (done) => {
    const middleware = compose(function (req: any, res: any, next: Callback) {
      req.one = true
      next()
    })

    const req: any = {}

    middleware(req, {}, function (err: Error) {
      expect(err).to.equal(undefined)
      expect(req.one).to.equal(true)

      return done()
    })
  })

  it('should noop with no middleware', (done) => {
    const middleware = compose([] as Middleware[])

    middleware({}, {}, done)
  })

  it('should validate all handlers are functions', () => {
    expect(() => compose(['foo'] as any)).to.throw(TypeError, 'Handlers must be a function')
  })

  it('should support error handlers', (done) => {
    const middleware = compose(
      function (req: any, res: any, next: Callback) {
        return next(new Error('test'))
      },
      function (_: Error, req: any, res: any, next: Callback) {
        return next()
      },
      function (req: any, res: any, next: Callback) {
        req.success = true
        return next()
      },
      function (_: Error, req: any, res: any, next: Callback) {
        req.fail = true
        return next()
      }
    )

    const req: any = {}

    middleware(req, {}, function (err) {
      expect(req.fail).to.equal(undefined)
      expect(req.success).to.equal(true)

      return done(err)
    })
  })

  it('should error when calling `next()` multiple times', (done) => {
    const middleware = compose(
      function (req: any, res: any, next: Callback) {
        next()

        try {
          next()
        } catch (err) {
          expect(err.message).to.equal('`next()` called multiple times')

          return done()
        }
      }
    )

    middleware({}, {}, function () {/* */})
  })

  it('should forward thrown errors', (done) => {
    const middleware = compose(
      function (req: any, res: any, next: Callback) {
        throw new Error('Boom!')
      }
    )

    middleware({}, {}, function (err) {
      expect(err).instanceOf(Error)
      expect(err.message).to.equal('Boom!')

      return done()
    })
  })
})
