// middleware/authenticate.ts
const WHITELISTED_KEYS = new Set([
  "DAYTON123KEY", // Replace with real keys
  "CUSTOMER456KEY"
]);

export function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || !WHITELISTED_KEYS.has(apiKey)) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  // Attach customer-specific config
  res.locals.customerConfig = {
    storeData: apiKey === "DAYTON123KEY" ? false : true // set false for Dayton
  };

  next();
}
