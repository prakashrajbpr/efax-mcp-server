// src/config.ts
export const API_KEYS: Record<string, { storeData: boolean }> = {
  "dayton-1234": { storeData: false }, // Do NOT store anything
  "internal-dev": { storeData: true }, // Allow storage for dev/test
};
