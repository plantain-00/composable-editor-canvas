import type { Command } from '../command'

export function getCommand(): Command {
  return {
    name: 'acquire point',
    useCommand({ onEnd }) {
      return {
        onStart(p, target) {
          onEnd({
            result: {
              position: p,
              target,
            },
          })
        },
      }
    },
    selectCount: 0,
  }
}
