"use strict";

// basic centralized error handler
export default (err, req, res, next) => {
  // log error (could use winston here)
  console.error(err && err.stack ? err.stack : err);

  const status = err && err.statusCode ? err.statusCode : 500;
  const message = err && err.message ? err.message : "Internal Server Error";

  // if response already sent, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    success: false,
    status,
    message,
  });
};
