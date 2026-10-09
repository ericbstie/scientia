// Production bundle into dist/ (used for the bundle-size metric; the server bundles on start).
const result = await Bun.build({ entrypoints: ["app/index.html"], outdir: "dist", minify: true, sourcemap: "none", define: { "process.env.NODE_ENV": JSON.stringify("production") } });
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
for (const o of result.outputs) console.log(o.path.replace(process.cwd() + "/", ""), `${(o.size / 1024).toFixed(1)} KB`);
