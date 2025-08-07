// src/middleware/auth.ts
import { API_KEYS } from "../config";

export function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || !(apiKey in API_KEYS)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Attach config to request
  res.locals.customerConfig = API_KEYS[apiKey];
  next();
}
