import type { Command } from '../command'

export function getCommand(): Command {
  return {
    name: 'acquire point',
    useCommand({ onEnd }) {
      return {
        onStart(p) {
          onEnd({
            result: p,
          })
        },
      }
    },
    selectCount: 0,
  }
}
