import { useTextClickCreate } from "../../src";
import { TextContent } from "../models/text-model";
import { Command } from "./command";

export const createTextCommand: Command = {
  name: 'create text',
  useCommand({ onEnd, type, scale }) {
    const { text, onClick, onMove, input } = useTextClickCreate(
      type === 'create text',
      (c) => onEnd({
        updateContents: (contents) => contents.push({
          type: 'text',
          ...c,
        } as TextContent)
      }),
      {
        scale,
      }
    )
    const assistentContents: (TextContent)[] = []
    if (text) {
      assistentContents.push({
        type: 'text',
        ...text,
      })
    }
    return {
      onStart: onClick,
      input,
      onMove,
      assistentContents,
    }
  },
  selectCount: 0,
  hotkey: 'T',
}
