const tsFiles = `"src/**/*.ts" "spec/**/*.ts"`

const importStories = 'IMPORT_STORY_OUTPUT_PATH=./dev/import-stories.ts types-as-schema "./dev/*.story.tsx" --config protocol-based-web-framework/import-stories'

export default {
  build: [
    'rimraf dist/',
    {
      back: [
        'tsc -p src/tsconfig.nodejs.json',
        'api-extractor run --local'
      ],
      front: [
        'tsc -p src/tsconfig.browser.json',
        'rollup --config rollup.config.js'
      ],
      importStories,
    },
    'webpack --config dev/webpack.prod.js'
  ],
  start: {
    importStories: importStories + ' --watch',
    webpack: 'webpack serve --config dev/webpack.dev.js',
  },
  lint: {
    ts: `eslint --ext .js,.ts ${tsFiles}`,
    export: `no-unused-export "src/**/*.ts" --strict --need-module tslib`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p src/tsconfig.nodejs.json --strict',
    typeCoverageBrowser: 'type-coverage -p src/tsconfig.browser.json --strict'
  },
  test: 'ava',
  fix: `eslint --ext .js,.ts ${tsFiles} --fix`
}
