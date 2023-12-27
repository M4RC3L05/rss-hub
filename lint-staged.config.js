export default {
  "*.{js,jsx,ts,tsx,mjs}": "biome check",
  "*.{ts,tsx}": () => "tsc -p tsconfig.json",
};
