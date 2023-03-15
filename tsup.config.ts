import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./index.ts'],
  format: ['esm', 'cjs'],
  minify: false,
  sourcemap: false,
  clean: true,
  target: 'node14'
})
