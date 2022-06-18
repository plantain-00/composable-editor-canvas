import { useEllipseClickCreate } from "../../src";
import { EllipseContent } from "../models/ellipse-model";
import { LineContent } from "../models/line-model";
import { Command } from "./command";

export const createEllipseCommand: Command = {
  name: 'create ellipse',
  type: [
    { name: 'ellipse center', hotkey: 'EL' },
    { name: 'ellipse endpoint' },
  ],
  useCommand({ onEnd, getAngleSnap, type, scale }) {
    const { ellipse, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = useEllipseClickCreate(
      type === 'ellipse center' || type === 'ellipse endpoint' ? type : undefined,
      (c) => onEnd({
        updateContents: (contents) => contents.push({ ...c, type: 'ellipse' })
      }),
      {
        getAngleSnap,
      },
    )
    const assistentContents: (LineContent | EllipseContent)[] = []
    if (startPosition && cursorPosition) {
      if (middlePosition) {
        assistentContents.push({ type: 'line', points: [startPosition, middlePosition], dashArray: [4 / scale] })
        if (type === 'ellipse center') {
          assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
        } else if (ellipse) {
          assistentContents.push({ type: 'line', points: [{ x: ellipse.cx, y: ellipse.cy }, cursorPosition], dashArray: [4 / scale] })
        }
      } else {
        assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
      }
    }
    if (ellipse) {
      assistentContents.push({ type: 'ellipse', ...ellipse })
    }
    return {
      onStart: onClick,
      input,
      onMove,
      assistentContents,
    }
  },
  selectCount: 0,
}
