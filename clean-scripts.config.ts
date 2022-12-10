import { build, Plugin, OnResolveArgs, OnResolveResult } from 'esbuild'
const tsFiles = `"src/**/*.ts" "src/**/*.tsx" "dev/**/*.ts" "dev/**/*.tsx"`

const importStories = 'types-as-schema -p ./types-as-schema.config.ts'
const importPlugins = 'types-as-schema -p ./types-as-schema.plugin.ts'

const packages = [
  { name: 'composable-type-validator', entry: './src/utils/validators.ts' },
  { name: 'react-render-target', entry: './src/components/react-render-target/index.ts' },
  { name: 'use-undo-redo', entry: './src/components/use-undo-redo.tsx' },
  { name: 'use-patch-based-undo-redo', entry: './src/components/use-patch-based-undo-redo.tsx' },
  // {
  //   name: 'expression-editor', entry: './src/components/expression-editor.tsx', onResolve: {
  //     filter: /^.\/react-render-target/,
  //     callback: () => {
  //       return { path: 'react-render-target', external: true }
  //     },
  //   }
  // }
] as {
  name: string, entry: string, onResolve?: {
    filter: RegExp
    callback: (args: OnResolveArgs) => OnResolveResult
  }
}[]

export default {
  build: [
    'rimraf packages/composable-editor-canvas/browser/',
    {
      js: Object.assign(
        {},
        ...packages.map(d => {
          const outfile = `packages/${d.name}/index.js`
          return {
            [d.name]: async () => {
              await build({
                entryPoints: [d.entry],
                bundle: true,
                outfile,
                plugins: d.onResolve ? [aliasToExternalPlugin(d.onResolve)] : [],
                format: 'esm',
                external: ['earcut', 'twgl.js', 'react', 'immer'],
              })
              return {
                name: `esbuild: bundle ${d.entry} to ${outfile}`
              }
            },
          }
        }),
      ),
      type: [
        'tsc -p src/tsconfig.browser.json',
        Object.assign(
          {
            all: 'api-extractor run --local',
          },
          ...packages.map(d => ({
            [d.name]: `api-extractor run --local -c packages/${d.name}/api-extractor.json`,
          })),
        ),
      ],
      dev: [
        {
          importStories,
          importPlugins,
        },
        {
          type: `tsc -p dev --noEmit`,
          js: 'webpack --config dev/webpack.prod.js',
        },
      ],
    },
  ],
  start: {
    importStories: importStories + ' --watch',
    importPlugins: importPlugins + ' --watch',
    webpack: 'webpack serve --config dev/webpack.dev.js',
  },
  lint: {
    ts: `eslint --ext .js,.ts ${tsFiles}`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p src/tsconfig.browser.json --strict',
    typeCoverageDev: 'type-coverage -p dev --strict'
  },
  fix: `eslint --ext .js,.ts ${tsFiles} --fix`
}

const aliasToExternalPlugin = (e: NonNullable<(typeof packages)[number]['onResolve']>): Plugin => ({
  name: 'alias to external',
  setup(build) {
    build.onResolve({ filter: e.filter }, e.callback)
  },
})
