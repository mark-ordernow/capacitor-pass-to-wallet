export default {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/plugin.cjs.js',
    format: 'cjs',
    sourcemap: false,
    inlineDynamicImports: true,
  },
  external: ['@capacitor/core'],
};
