import { useLineClickCreate } from "../../src";
import { RectContent } from "../models/rect-model";
import { Command } from "./command";

export const createRectCommand: Command = {
  name: 'create rect',
  useCommand({ onEnd, getAngleSnap, type }) {
    const { line, onClick, onMove, input } = useLineClickCreate(
      type === 'create rect',
      (c) => onEnd({
        updateContents: (contents) => contents.push({
          type: 'rect',
          x: (c[0].x + c[1].x) / 2,
          y: (c[0].y + c[1].y) / 2,
          width: Math.abs(c[0].x - c[1].x),
          height: Math.abs(c[0].y - c[1].y),
          angle: 0,
        } as RectContent)
      }),
      {
        once: true,
        getAngleSnap,
      },
    )
    const assistentContents: (RectContent)[] = []
    if (line) {
      assistentContents.push({
        type: 'rect',
        x: (line[0].x + line[1].x) / 2,
        y: (line[0].y + line[1].y) / 2,
        width: Math.abs(line[0].x - line[1].x),
        height: Math.abs(line[0].y - line[1].y),
        angle: 0,
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
  hotkey: 'REC',
}
