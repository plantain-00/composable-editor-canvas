import { useLineClickCreate } from "../../src";
import { ArrowContent } from "../models/arrow-model";
import { Command } from "./command";

export const createArrowCommand: Command = {
  name: 'create arrow',
  useCommand({ onEnd, type }) {
    const { line, onClick, onMove, input, lastPosition } = useLineClickCreate(
      type === 'create arrow',
      (c) => onEnd({
        updateContents: (contents) => contents.push({
          type: 'arrow',
          p1: c[0],
          p2: c[1],
        } as ArrowContent)
      }),
      {
        once: true,
      },
    )
    const assistentContents: (ArrowContent)[] = []
    if (line) {
      assistentContents.push({
        type: 'arrow',
        p1: line[0],
        p2: line[1],
      })
    }
    return {
      onStart: onClick,
      input,
      onMove,
      assistentContents,
      lastPosition,
    }
  },
  selectCount: 0,
  hotkey: 'REC',
}
