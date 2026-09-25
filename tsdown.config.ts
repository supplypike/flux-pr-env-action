import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/main.ts' },
  outDir: 'dist',
  format: ['cjs'],
  platform: 'node',
  target: 'node24',
  clean: true,
  deps: {
    alwaysBundle: [/.*/],
    onlyBundle: false
  },
  failOnWarn: false
})
