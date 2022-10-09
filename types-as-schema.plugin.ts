import { Configuration } from 'types-as-schema'
import { transformSync } from 'esbuild'

const config: Configuration = {
  files: [
    './dev/plugins/*.plugin.tsx',
  ],
  plugins: [
    (_typeDeclarations, _, sourceFiles) => [
      {
        path: './dev/plugins/variables.ts',
        content: `export const pluginScripts = [\n` + sourceFiles.map(s => {
          const result = transformSync(s.text, { loader: 'tsx' })
          return `\`${result.code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,`
        }).join('\n') + '\n]',
      }
    ],
  ],
}

export default config
