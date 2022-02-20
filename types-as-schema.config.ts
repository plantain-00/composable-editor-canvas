import { Configuration } from 'types-as-schema'
import { generateImportStoriesDeclaration } from 'protocol-based-web-framework'

const config: Configuration = {
  files: [
    './dev/*.story.tsx',
  ],
  plugins: [
    (typeDeclarations) => generateImportStoriesDeclaration(typeDeclarations, './dev/import-stories.ts'),
  ],
}

export default config
