const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization");

  /**
   * 1. Check for authentication token
   * 2. if token not found, return a un auth response
   *
   * 3. if found continue to the next function
   */

  if (!token) return res.status(401).send("Unauthenticated");

  console.log(token);
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    console.log(user);
    req.user = user;

    next();
  } catch (err) {
    res.status(403).send("Invalid token");
  }
};
