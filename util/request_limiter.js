const rateLimit = require("express-rate-limit");

export const requestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      status: "failed",
      msg: "Too many requests from this IP, please try again later after 1 minute.",
    });
  },
});
