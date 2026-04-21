import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  external: ['better-sqlite3', 'sqlite-vec', '@xenova/transformers', 'squatter', 'cmpstr'],
})
