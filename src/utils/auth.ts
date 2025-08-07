// src/utils/auth.ts

// ✅ Centralized API key whitelist
export const API_KEY_WHITELIST = [
  "dayton-children-001",
  "test-key-123",
  "pegasus-dev-key",
  "your-test-api-key",
  "dayton-key"
];

// ✅ Single export function for validation
export function isValidApiKey(apiKey?: string): boolean {
  return !!apiKey && API_KEY_WHITELIST.includes(apiKey);
}

