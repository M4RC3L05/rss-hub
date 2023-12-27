export default {
  "*.{js,jsx,ts,tsx,mjs}": "biome lint",
  "*.{ts,tsx}": () => "tsc -p tsconfig.json",
};
