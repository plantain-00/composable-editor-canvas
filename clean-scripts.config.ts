import { build } from 'esbuild'
const tsFiles = `"src/**/*.ts" "src/**/*.tsx" "dev/**/*.ts" "dev/**/*.tsx"`

const importStories = 'types-as-schema -p ./types-as-schema.config.ts'
const importPlugins = 'types-as-schema -p ./types-as-schema.plugin.ts'

const packages = [
  { name: 'composable-type-validator', entry: './src/utils/validators.ts' },
  { name: 'react-render-target', entry: './src/components/react-render-target/index.ts' },
  { name: 'use-undo-redo', entry: './src/components/use-undo-redo.tsx' },
  { name: 'use-patch-based-undo-redo', entry: './src/components/use-patch-based-undo-redo.tsx' },
  { name: 'react-composable-json-editor', entry: './src/components/react-composable-json-editor/index.tsx' },
  { name: 'react-composable-expression-editor', entry: './src/components/expression-editor.tsx' }
]

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
              const depdendencies = packages.map(p => p.name).filter(n => n !== d.name)
              await build({
                entryPoints: [d.entry],
                bundle: true,
                outfile,
                plugins: depdendencies.length > 0 ? [{
                  name: 'alias to external',
                  setup(build) {
                    depdendencies.forEach(d => {
                      build.onResolve({ filter: new RegExp('/' + d) }, () => ({ path: d, external: true }))
                    })
                  },
                }] : [],
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
