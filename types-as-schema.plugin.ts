import { Configuration } from 'types-as-schema'
import { buildSync } from 'esbuild'

const config: Configuration = {
  files: [
    './dev/cad-editor/plugins/*.plugin.tsx',
  ],
  plugins: [
    (_typeDeclarations, _, sourceFiles) => {
      const result = buildSync({
        format: 'esm',
        entryPoints: sourceFiles.map(s => s.fileName),
        write: false,
        outdir: '.',
        target: 'ES2018',
        bundle: true,
      })
      return [{
        path: './dev/cad-editor/plugins/variables.ts',
        content: `export const pluginScripts = [\n` + result.outputFiles.map(s => {
          return `\`${s.text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,`
        }).join('\n') + '\n]',
      }]
    },
  ],
}

export default config
