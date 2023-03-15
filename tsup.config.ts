import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./index.ts'],
  format: ['esm', 'cjs'],
  minify: true,
  sourcemap: false,
  clean: true
})
