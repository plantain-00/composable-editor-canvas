import { Configuration } from 'types-as-schema'

const config: Configuration = {
  files: [
    './node_modules/typescript/lib/lib.es5.d.ts',
    './node_modules/typescript/lib/lib.es2015.core.d.ts',
  ],
  plugins: [
    (typeDeclarations) => {
      const result: { name: string, comment?: string, parameters?: { name: string, comment?: string, optional?: boolean }[] }[] = []
      for (const math of typeDeclarations.filter(t => t.name === 'Math')) {
        if (math.kind === 'object') {
          for (const member of math.members) {
            result.push({
              name: member.name,
              comment: member.jsDocs?.find(d => d.name === '')?.comment,
              parameters: member.parameters?.map(p => ({
                name: p.name,
                comment: p.comments?.[0],
                optional: p.optional,
              }))
            })
          }
        }
      }
      return [{
        path: './dev/math.ts',
        content: `export const math = ` + JSON.stringify([{ name: 'Math', members: result }], null, 2) + '',
      }]
    },
  ],
}

export default config
