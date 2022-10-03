import { useEllipseArcClickCreate } from "../../src";
import { EllipseArcContent } from "../models/ellipse-arc-model";
import { EllipseContent, rotatePositionByEllipseCenter } from "../models/ellipse-model";
import { LineContent } from "../models/line-model";
import { PolygonContent } from "../models/polygon-model";
import { Command } from "./command";

export const createEllipseArcCommand: Command = {
  name: 'create ellipse arc',
  useCommand({ onEnd, getAngleSnap, type, scale }) {
    const { ellipse, ellipseArc, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = useEllipseArcClickCreate(
      type === 'create ellipse arc' ? 'ellipse center' : undefined,
      (c) => onEnd({
        updateContents: (contents) => contents.push({ ...c, type: 'ellipse arc' }),
      }),
      {
        getAngleSnap,
      },
    )
    const assistentContents: (LineContent | PolygonContent | EllipseContent | EllipseArcContent)[] = []
    if (startPosition && cursorPosition) {
      if (middlePosition) {
        assistentContents.push({ type: 'line', points: [startPosition, middlePosition], dashArray: [4 / scale] })
        const center = type === 'create ellipse arc'
          ? startPosition
          : { x: (startPosition.x + middlePosition.x) / 2, y: (startPosition.y + middlePosition.y) / 2 }
        assistentContents.push({ type: 'line', points: [center, cursorPosition], dashArray: [4 / scale] })
      } else {
        assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
      }
    }
    if (ellipseArc) {
      assistentContents.push({ ...ellipseArc, dashArray: [4 / scale], type: 'ellipse' })
      if (ellipseArc.startAngle !== ellipseArc.endAngle) {
        assistentContents.push(
          {
            type: 'line', points: [
              rotatePositionByEllipseCenter({
                x: ellipseArc.cx + ellipseArc.rx * Math.cos(ellipseArc.startAngle / 180 * Math.PI),
                y: ellipseArc.cy + ellipseArc.ry * Math.sin(ellipseArc.startAngle / 180 * Math.PI)
              }, ellipseArc),
              {
                x: ellipseArc.cx,
                y: ellipseArc.cy
              },
            ],
            dashArray: [4 / scale]
          },
          {
            type: 'line', points: [
              {
                x: ellipseArc.cx,
                y: ellipseArc.cy
              },
              rotatePositionByEllipseCenter({
                x: ellipseArc.cx + ellipseArc.rx * Math.cos(ellipseArc.endAngle / 180 * Math.PI),
                y: ellipseArc.cy + ellipseArc.ry * Math.sin(ellipseArc.endAngle / 180 * Math.PI)
              }, ellipseArc),
            ],
            dashArray: [4 / scale]
          },
        )
      }
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [{ x: ellipseArc.cx, y: ellipseArc.cy }, cursorPosition], dashArray: [4 / scale] })
      }
    } else if (ellipse) {
      assistentContents.push({ ...ellipse, dashArray: [4 / scale], type: 'ellipse' })
      if (cursorPosition) {
        assistentContents.push({ type: 'line', points: [{ x: ellipse.cx, y: ellipse.cy }, cursorPosition], dashArray: [4 / scale] })
      }
    }
    if (ellipseArc && ellipseArc.startAngle !== ellipseArc.endAngle) {
      assistentContents.push({ ...ellipseArc, type: 'ellipse arc' })
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
}
