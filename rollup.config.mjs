import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json' assert { type: 'json' };
import { dirname } from 'path';

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({ tsconfig: './tsconfig.main.json' })
  ],
  output: [
    {
      dir: `dist/${dirname(pkg.main)}`,
      preserveModules: true,
      entryFileNames: '[name].js',
      format: 'cjs'
    },
    {
      dir: `dist/${dirname(pkg.module)}`,
      preserveModules: true,
      entryFileNames: '[name].mjs',
      format: 'esm'
    }
  ]
};