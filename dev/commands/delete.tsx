import { Command } from "./command"

export const deleteCommand: Command = {
  name: 'delete',
  executeCommand() {
    return {
      removed: true,
    }
  },
}
