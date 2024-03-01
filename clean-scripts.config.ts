import { build, BuildOptions } from 'esbuild'
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
  { name: 'equation-renderer', entry: './src/components/equation-renderer.tsx' },
  { name: 'equation-solver', entry: './src/components/equation-solver/index.tsx' },
  { name: 'equation-calculater', entry: './src/utils/equation-calculater.ts' },
]

export default {
  build: [
    'rimraf packages/composable-editor-canvas/browser/',
    {
      js: [
        async () => {
          await Promise.all(packages.map(bundleJs))
          return { name: 'bundle js' }
        },
        `eslint --no-eslintrc --parser-options ecmaVersion:latest --parser-options sourceType:module --plugin unused-imports --rule 'unused-imports/no-unused-imports:error' ${packages.map(p => `packages/${p.name}/index.js`).join(' ')} --fix`,
        async () => {
          await Promise.all(packages.map(bundleJs2))
          return { name: 'bundle js 2' }
        },
        async () => {
          await savePackageSizes()
          return { name: 'save package sizes' }
        },
      ],
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

const option: BuildOptions = {
  bundle: true,
  format: 'esm',
  external: ['earcut', 'twgl.js', 'react', 'react-dom', 'immer', 'expression-engine', 'verb-nurbs-web'],
}

async function bundleJs(d: typeof packages[number]) {
  const outfile = `packages/${d.name}/index.js`
  const possibleDepdendencies = packages.map(p => p.name).filter(n => n !== d.name)
  await build({
    entryPoints: [d.entry],
    outfile,
    ...option,
    plugins: possibleDepdendencies.length > 0 ? [{
      name: 'alias to external',
      setup(build) {
        possibleDepdendencies.forEach(d => {
          build.onResolve({ filter: new RegExp('/' + d) }, () => {
            return { path: d, external: true }
          })
        })
      },
    }] : [],
  })
}

async function bundleJs2(d: typeof packages[number]) {
  const outfile = `packages/${d.name}/index.js`
  const possibleDepdendencies = packages.map(p => p.name).filter(n => n !== d.name)
  const depdendencies = new Set<string>()
  await build({
    entryPoints: [outfile],
    outfile,
    ...option,
    allowOverwrite: true,
    plugins: possibleDepdendencies.length > 0 ? [{
      name: 'alias to external',
      setup(build) {
        possibleDepdendencies.forEach(d => {
          build.onResolve({ filter: new RegExp(d) }, () => {
            depdendencies.add(d)
            return { path: d, external: true }
          })
        })
      },
    }] : [],
  })
  if (depdendencies.size > 0) {
    const packageJsonPath = `./packages/${d.name}/package.json`
    const packageJson: { dependencies?: Record<string, string> } = JSON.parse((await readFileAsync(packageJsonPath)).toString())
    if (!packageJson.dependencies) {
      packageJson.dependencies = {}
    }
    for (const d of depdendencies) {
      if (!packageJson.dependencies[d]) {
        packageJson.dependencies[d] = "1"
      }
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

async function savePackageSizes() {
  const sizes = await Promise.all(packages.map(async d => {
    const buffer = await readFileAsync(`packages/${d.name}/index.js`)
    return d.name + ': ' + buffer.length.toPrecision(3) + '\n'
  }))
  await writeFileAsync('package-size.txt', sizes.join(''))
}
