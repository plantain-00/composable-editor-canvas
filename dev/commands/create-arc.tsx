import { getTwoPointsDistance, useCircleArcClickCreate } from "../../src";
import { ArcContent } from "../models/arc-model";
import { CircleContent } from "../models/circle-model";
import { LineContent } from "../models/line-model";
import { PolygonContent } from "../models/polygon-model";
import { TextContent } from "../models/text-model";
import { Command } from "./command";

export const createArcCommand: Command = {
  name: 'create arc',
  useCommand({ onEnd, getAngleSnap, type, scale }) {
    const { circle, arc, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = useCircleArcClickCreate(
      type === 'create arc' ? 'center radius' : undefined,
      (c) => onEnd({
        updateContents: (contents) => contents.push({ ...c, type: 'arc' })
      }),
      {
        getAngleSnap,
      },
    )
    const assistentContents: (LineContent | PolygonContent | CircleContent | TextContent | ArcContent)[] = []
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
    if (arc) {
      assistentContents.push({ ...arc, dashArray: [4 / scale], type: 'circle' })
      if (arc.startAngle !== arc.endAngle) {
        assistentContents.push(
          {
            type: 'line', points: [
              {
                x: arc.x + arc.r * Math.cos(arc.startAngle / 180 * Math.PI),
                y: arc.y + arc.r * Math.sin(arc.startAngle / 180 * Math.PI)
              },
              {
                x: arc.x,
                y: arc.y
              },
            ],
            dashArray: [4 / scale]
          },
          {
            type: 'line', points: [
              {
                x: arc.x,
                y: arc.y
              },
              {
                x: arc.x + arc.r * Math.cos(arc.endAngle / 180 * Math.PI),
                y: arc.y + arc.r * Math.sin(arc.endAngle / 180 * Math.PI)
              },
            ],
            dashArray: [4 / scale]
          },
        )
      }
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [arc, cursorPosition], dashArray: [4 / scale] })
      }
    }
    if (circle) {
      assistentContents.push({ ...circle, dashArray: [4 / scale], type: 'circle' })
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [circle, cursorPosition], dashArray: [4 / scale] })
      }
    }
    if (arc && arc.startAngle !== arc.endAngle) {
      assistentContents.push({ ...arc, type: 'arc' })
    }
    return {
      onStart: onClick,
      input,
      onMove,
      assistentContents,
      lastPosition: middlePosition ?? startPosition,
    }
  },
  selectCount: 0,
  hotkey: 'A',
}
