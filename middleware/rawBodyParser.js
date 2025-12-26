// middleware/rawBodyParser.js

export const rawBodyParser = (req, res, next) => {
  let data = [];
  req.on("data", (chunk) => {
    data.push(chunk);
  });
  req.on("end", () => {
    if (data.length) {
      const raw = Buffer.concat(data);
      req.rawBody = raw;

      // Parse JSON only if NOT webhook route
      if (req.originalUrl !== "/api/webhooks/order-created") {
        try {
          req.body = JSON.parse(raw.toString("utf8"));
        } catch (err) {
          return res.status(400).send("Invalid JSON");
        }
      }
    } else {
      // No body sent (empty)
      req.rawBody = Buffer.from("");
      if (req.originalUrl !== "/api/webhooks/order-created") {
        req.body = {};
      }
    }
    next();
  });
};
