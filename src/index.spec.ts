import { compose, Next, Middleware } from "./index";

describe("compose middleware", () => {
  it("should be assignable to array of middleware", done => {
    const pipeline = <T, U>(...middlewares: Array<Middleware<T, U>>) =>
      compose(middlewares);
    const middleware = pipeline(
      (req: undefined, res: undefined, next: () => void) => next()
    );

    return middleware(undefined, undefined, done);
  });

  it("should compose middleware", done => {
    const middleware = compose([
      function(req: any, res: any, next: Next) {
        req.one = true;
        next();
      },
      function(req: any, res: any, next: Next) {
        req.two = true;
        next();
      }
    ]);

    const req: any = {};
    const res: any = {};

    middleware(req, res, function(err) {
      expect(err).toEqual(undefined);
      expect(req.one).toEqual(true);
      expect(req.two).toEqual(true);

      return done();
    });
  });

  it("should exit with an error", done => {
    const middleware = compose([
      function(req: any, res: any, next: Next) {
        req.one = true;
        next(new Error("test"));
      },
      function(req: any, res: any, next: Next) {
        req.two = true;
        next();
      }
    ]);

    const req: any = {};
    const res: any = {};

    middleware(req, res, function(err) {
      expect(err).toBeInstanceOf(Error);
      expect(req.one).toEqual(true);
      expect(req.two).toEqual(undefined);

      return done();
    });
  });

  it("should short-cut handler with a single function", done => {
    const middleware = compose([
      function(req: any, res: any, next: Next) {
        req.one = true;
        next();
      }
    ]);

    const req: any = {};
    const res: any = {};

    middleware(req, res, function(err) {
      expect(err).toEqual(undefined);
      expect(req.one).toEqual(true);

      return done();
    });
  });

  it("should accept a single function", done => {
    const middleware = compose<any, any>(function(
      req: any,
      res: any,
      next: Next
    ) {
      req.one = true;
      next();
    });

    const req: any = {};

    middleware(req, {}, function(err?: Error | null) {
      expect(err).toEqual(undefined);
      expect(req.one).toEqual(true);

      return done();
    });
  });

  it("should noop with no middleware", done => {
    const middleware = compose([]);

    middleware({}, {}, done);
  });

  it("should validate all handlers are functions", () => {
    expect(() => compose(["foo"] as any)).toThrow(
      new TypeError("Handlers must be a function")
    );
  });

  it("should support error handlers", done => {
    const middleware = compose(
      function(req: any, res: any, next: Next) {
        return next(new Error("test"));
      },
      function(_: Error, req: any, res: any, next: Next) {
        return next();
      },
      function(req: any, res: any, next: Next) {
        req.success = true;
        return next();
      },
      function(_: Error, req: any, res: any, next: Next) {
        req.fail = true;
        return next();
      }
    );

    const req: any = {};

    middleware(req, {} as any, function(err) {
      expect(req.fail).toEqual(undefined);
      expect(req.success).toEqual(true);

      return done(err);
    });
  });

  it("should error when calling `next()` multiple times", done => {
    const middleware = compose<any, any>(function(
      req: any,
      res: any,
      next: Next
    ) {
      next();
      next();
    });

    try {
      middleware({}, {}, function() {
        /* */
      });
    } catch (err) {
      expect(err.message).toEqual("`next()` called multiple times");

      return done();
    }
  });

  it("should forward thrown errors", done => {
    const middleware = compose<any, any>(function(
      req: any,
      res: any,
      next: Next
    ) {
      throw new Error("Boom!");
    });

    middleware({}, {}, function(err) {
      expect(err).toBeInstanceOf(Error);
      expect(err!.message).toEqual("Boom!");

      return done();
    });
  });

  it("should not cascade errors from `done()`", done => {
    const request = {
      done: 0,
      first: 0,
      second: 0,
      third: 0
    };

    const middleware = compose<typeof request, any>(
      function(req: typeof request, res: any, next: Next) {
        req.first++;

        return next();
      },
      function(req: typeof request, res: any, next: Next) {
        req.second++;

        throw new TypeError("Boom!");
      },
      function(req: typeof request, res: any, next: Next) {
        req.third++;

        return next();
      }
    );

    try {
      middleware(request, {}, function() {
        request.done++;

        throw new TypeError("This is the end");
      });
    } catch (err) {
      expect(request.done).toEqual(1);
      expect(request.first).toEqual(1);
      expect(request.second).toEqual(1);
      expect(request.third).toEqual(0);

      expect(err).toBeInstanceOf(TypeError);
      expect(err.message).toEqual("This is the end");

      return done();
    }

    return done(new TypeError("Missed thrown error"));
  });

  it("should avoid handling post-next thrown errors", function(done) {
    const middleware = compose<any, any>(
      function(req: any, res: any, next: Next) {
        return next();
      },
      function(req: any, res: any, next: Next) {
        next();
        throw new TypeError("Boom!");
      },
      function(req: any, res: any, next: Next) {
        return setTimeout(next);
      }
    );

    try {
      middleware({}, {}, function(err) {
        return done(err);
      });
    } catch (err) {
      expect(err).toBeInstanceOf(TypeError);
      expect(err.message).toEqual("Boom!");
      return;
    }

    return done(new TypeError("Missed thrown error"));
  });

  it("should compose functions without all arguments", function(done) {
    const middleware = compose<any, any>(
      function(req: any, res: any, next: Next) {
        return next();
      },
      function() {
        return done();
      }
    );

    middleware({}, {}, function(err) {
      return done(err || new Error("Middleware should not have finished"));
    });
  });
});
