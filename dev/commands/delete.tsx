import { Command } from "./command"

export const deleteCommand: Command = {
  name: 'delete',
  execuateCommand() {
    return {
      removed: true,
    }
  },
}
