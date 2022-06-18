import { useCircleClickCreate, getTwoPointsDistance } from "../../src";
import { CircleContent } from "../models/circle-model";
import { LineContent } from "../models/line-model";
import { PolygonContent } from "../models/polygon-model";
import { TextContent } from "../models/text-model";
import { Command } from "./command";

export const createCircleCommand: Command = {
  name: 'create circle',
  type: [
    { name: '2 points' },
    { name: '3 points' },
    { name: 'center radius', hotkey: 'C' },
    { name: 'center diameter' },
  ],
  useCommand({ onEnd, scale, getAngleSnap, type }) {
    const { circle, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = useCircleClickCreate(
      type === '2 points' || type === '3 points' || type === 'center diameter' || type === 'center radius' ? type : undefined,
      (c) => onEnd({
        updateContents: (contents) => contents.push({ ...c, type: 'circle' })
      }),
      {
        getAngleSnap,
      },
    )
    const assistentContents: (LineContent | PolygonContent | TextContent | CircleContent)[] = []
    if (startPosition && cursorPosition) {
      if (middlePosition) {
        assistentContents.push({ type: 'polygon', points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] })
      } else {
        assistentContents.push(
          { type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] },
          {
            type: 'text',
            x: (startPosition.x + cursorPosition.x) / 2 - 20,
            y: (startPosition.y + cursorPosition.y) / 2 + 4,
            text: getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
            color: 0xff0000,
            fontSize: 16 / scale,
            fontFamily: 'monospace',
          },
        )
      }
    }
    if (circle) {
      assistentContents.push({ type: 'circle', ...circle })
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
