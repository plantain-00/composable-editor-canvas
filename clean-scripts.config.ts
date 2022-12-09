import { Tasks } from 'clean-scripts'
const tsFiles = `"src/**/*.ts" "src/**/*.tsx" "dev/**/*.ts" "dev/**/*.tsx"`

const importStories = 'types-as-schema -p ./types-as-schema.config.ts'
const importPlugins = 'types-as-schema -p ./types-as-schema.plugin.ts'

export default {
  build: [
    'rimraf packages/composable-canvas-editor/browser/',
    {
      front: [
        'tsc -p src/tsconfig.browser.json',
        'api-extractor run --local',
        'rollup --config rollup.config.mjs'
      ],
      dev: [
        importStories,
        importPlugins,
        `tsc -p dev --noEmit`,
      ],
    },
    new Tasks([
      {
        name: 'composable-type-validator', entry: './src/utils/validators.ts',
      }
    ].map((d) => ({
      name: d.name,
      script: [
        `esbuild ${d.entry} --bundle --outfile=packages/${d.name}/index.js --format=esm`,
        `api-extractor run --local -c packages/${d.name}/api-extractor.json`,
      ],
      dependencies: [],
    }))),
    'webpack --config dev/webpack.prod.js'
  ],
  start: {
    importStories: importStories + ' --watch',
    importPlugins: importPlugins + ' --watch',
    webpack: 'webpack serve --config dev/webpack.dev.js',
  },
  lint: {
    ts: `eslint --ext .js,.ts ${tsFiles}`,
    export: `no-unused-export "src/**/*.ts" "src/**/*.tsx" --strict --need-module tslib`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p src/tsconfig.browser.json --strict',
    typeCoverageDev: 'type-coverage -p dev --strict'
  },
  test: 'ava --timeout=30s',
  fix: `eslint --ext .js,.ts ${tsFiles} --fix`
}

