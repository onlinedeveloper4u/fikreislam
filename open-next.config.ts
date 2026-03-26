import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    runtime: "edge",
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
  },
};

export default config;
