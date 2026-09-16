import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const watch = process.argv.includes('--watch');
const serve = process.argv.includes('--serve');
const outdir = 'dist';
fs.rmSync(outdir, { recursive: true, force: true });
fs.mkdirSync(outdir, { recursive: true });

// TensorFlow.js (inside MindAR) references Node built-ins behind runtime
// checks that never run in the browser. Stub them so the bundle is browser-only.
const NODE_BUILTINS = /^(fs|path|util|buffer|crypto|worker_threads|perf_hooks|os|module)$/;
const stubNodeBuiltins = {
  name: 'stub-node-builtins',
  setup(build) {
    build.onResolve({ filter: NODE_BUILTINS }, (args) => ({ path: args.path, namespace: 'node-stub' }));
    build.onLoad({ filter: /.*/, namespace: 'node-stub' }, () => ({ contents: 'module.exports = {};', loader: 'js' }));
  },
};

const ctx = await esbuild.context({
  entryPoints: { app: 'src/app.js' },
  plugins: [stubNodeBuiltins],
  bundle: true,
  format: 'esm',
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  target: ['es2020', 'safari14', 'chrome90'],
  outdir,
  logLevel: 'info',
  define: { 'process.env.NODE_ENV': watch ? '"development"' : '"production"' },
});

const copyStatic = () => {
  fs.copyFileSync('index.html', path.join(outdir, 'index.html'));
  fs.copyFileSync('src/app.css', path.join(outdir, 'app.css'));
  for (const f of fs.readdirSync('public')) fs.copyFileSync(path.join('public', f), path.join(outdir, f));
};
copyStatic();

if (watch) {
  await ctx.watch();
  fs.watch('src', () => copyStatic());
  if (serve) {
    const { host, port } = await ctx.serve({ servedir: outdir, port: 4173 });
    console.log(`viewer at http://${host}:${port}/?templateId=...&api=http://localhost:5000`);
  }
} else {
  await ctx.rebuild();
  await ctx.dispose();
  const size = (f) => (fs.statSync(path.join(outdir, f)).size / 1024).toFixed(0) + ' KB';
  console.log(`built: app.js ${size('app.js')}, app.css ${size('app.css')}`);
}
