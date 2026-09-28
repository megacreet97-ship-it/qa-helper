import { build as viteBuild } from "vite";
import { build as esbuild } from "esbuild";
import { rm, cp } from "fs/promises";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    packages: "external",
    logLevel: "info",
    // server/vite.ts is dev-only (loaded when NODE_ENV !== "production")
    plugins: [
      {
        name: "exclude-dev-vite",
        setup(b) {
          b.onResolve({ filter: /^\.\/vite$/ }, (args) => ({ path: args.path, external: true }));
        },
      },
    ],
  });

  // fonts for the PDF generator
  await cp("server/assets", "dist/assets", { recursive: true });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
