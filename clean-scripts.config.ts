import { build } from 'esbuild'
import { promisify } from 'util'
import { readFile, writeFile } from 'fs'
import { rollup } from 'rollup'
import dts from "rollup-plugin-dts"
const tsFiles = `"src/**/*.ts" "src/**/*.tsx" "dev/**/*.ts" "dev/**/*.tsx"`

const importStories = 'types-as-schema -p ./types-as-schema.config.ts'
const importPlugins = 'types-as-schema -p ./types-as-schema.plugin.ts'

const packages = [
  { name: 'composable-type-validator', entry: './src/utils/validators.ts' },
  { name: 'react-render-target', entry: './src/components/react-render-target/index.ts' },
  { name: 'use-undo-redo', entry: './src/components/use-undo-redo.tsx' },
  { name: 'use-patch-based-undo-redo', entry: './src/components/use-patch-based-undo-redo.tsx' },
  { name: 'react-composable-json-editor', entry: './src/components/react-composable-json-editor/index.tsx' },
  { name: 'react-composable-expression-editor', entry: './src/components/expression-editor.tsx' },
  { name: 'use-wheel-zoom', entry: './src/components/use-wheel-zoom.tsx' },
  { name: 'use-wheel-scroll', entry: './src/components/use-wheel-scroll.tsx' },
  { name: 'use-drag-select', entry: './src/components/use-drag-select.tsx' },
  { name: 'use-drag-move', entry: './src/components/use-drag-move.tsx' },
  { name: 'use-drag-resize', entry: './src/components/use-drag-resize.tsx' },
  { name: 'use-drag-rotate', entry: './src/components/use-drag-rotate.tsx' },
]

export default {
  build: [
    'rimraf packages/composable-editor-canvas/browser/',
    {
      js: async () => {
        await Promise.all(packages.map(bundleJs))
        return { name: 'bundle js' }
      },
      type: [
        'tsc -p src/tsconfig.browser.json',
        async () => {
          await Promise.all([{ name: 'composable-editor-canvas', entry: './src/index.ts' }, ...packages].map(bundleType))
          return { name: 'bundle type' }
        },
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

const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

async function bundleJs(d: typeof packages[number]) {
  const outfile = `packages/${d.name}/index.js`
  const depdendencies = new Set<string>()
  const possibleDepdendencies = packages.map(p => p.name).filter(n => n !== d.name)
  await build({
    entryPoints: [d.entry],
    bundle: true,
    outfile,
    plugins: possibleDepdendencies.length > 0 ? [{
      name: 'alias to external',
      setup(build) {
        possibleDepdendencies.forEach(d => {
          build.onResolve({ filter: new RegExp('/' + d) }, () => {
            depdendencies.add(d)
            return { path: d, external: true }
          })
        })
      },
    }] : [],
    format: 'esm',
    external: ['earcut', 'twgl.js', 'react', 'immer'],
  })
  if (depdendencies.size > 0) {
    const packageJsonPath = `./packages/${d.name}/package.json`
    const packageJson: { dependencies?: Record<string, string> } = JSON.parse((await readFileAsync(packageJsonPath)).toString())
    if (!packageJson.dependencies) {
      packageJson.dependencies = {}
    }
    for (const d of depdendencies) {
      packageJson.dependencies[d] = "1"
    }
    await writeFileAsync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }
}

async function bundleType(d: typeof packages[number]) {
  const inputfile = `packages/composable-editor-canvas/browser/${d.entry.replace('./src/', '').replace('.tsx', '').replace('.ts', '')}.d.ts`
  const bundle = await rollup({
    input: inputfile,
    plugins: [dts()],
  })
  const outfile = `packages/${d.name}/index.d.ts`
  await bundle.write({ file: outfile, format: "es" })
  await bundle.close()
}
