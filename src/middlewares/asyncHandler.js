"use strict";

// simple async wrapper to forward errors to next(error)
export default (fn) => {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
