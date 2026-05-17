import { defineConfig } from "vite";
import prototypePrd from "prototype-prd-vite-plugin";

export default defineConfig({
  plugins: [
    prototypePrd({
      defaultTitle: "Checkout Flow PRD"
    })
  ]
});
