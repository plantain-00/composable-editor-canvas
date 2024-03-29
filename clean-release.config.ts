import { Configuration } from 'clean-release'

const config: Configuration = {
  include: [
    'packages/**/*.js',
    'packages/*/index.d.ts',
    'packages/*/package.json',
    'packages/*/README.md',
  ],
  exclude: [
  ],
  askVersion: true,
  changesGitStaged: true,
  postScript: ({ dir, tag, version, effectedWorkspacePaths = [] }) => [
    ...effectedWorkspacePaths.map((w) => w.map((e) => tag ? `npm publish "${dir}/${e}" --access public --tag ${tag}` : `npm publish "${dir}/${e}" --access public`)),
    'git add package.json',
    `git commit -m "${version}"`,
    `git tag -a v${version} -m 'v${version}'`,
    'git push',
    `git push origin v${version}`
  ]
}

export default config
