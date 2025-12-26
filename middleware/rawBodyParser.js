import rawBody from "raw-body";

export const rawBodyParser = (req, res, next) => {
  if (req.originalUrl === "/api/webhooks/order-created") {
    rawBody(req, {
      length: req.headers["content-length"],
      limit: "1mb",
      encoding: true,
    })
      .then((buf) => {
        req.rawBody = buf;
        next();
      })
      .catch(next);
  } else {
    next();
  }
};
