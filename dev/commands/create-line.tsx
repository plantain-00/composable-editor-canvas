import { getTwoPointsDistance, iteratePolylineLines, useLineClickCreate } from "../../src";
import { ArcContent } from "../models/arc-model";
import { LineContent } from "../models/line-model";
import { TextContent } from "../models/text-model";
import { Command } from "./command";

export const createLineCommand: Command = {
  name: 'create line',
  useCommand({ onEnd, scale, type }) {
    const { line, onClick, onMove, input, inputMode, lastPosition } = useLineClickCreate(
      type === 'create line',
      (c) => onEnd({
        updateContents: (contents) => contents.push(...Array.from(iteratePolylineLines(c)).map((line) => ({ points: line, type: 'line' })))
      }),
    )
    const assistentContents: (LineContent | ArcContent | TextContent)[] = []
    if (line && line.length > 1) {
      const start = line[line.length - 2]
      const end = line[line.length - 1]
      const r = getTwoPointsDistance(start, end)
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI
      assistentContents.push(
        {
          type: 'arc',
          x: start.x,
          y: start.y,
          r,
          dashArray: [4 / scale],
          startAngle: angle > 180 || angle < 0 ? angle : 0,
          endAngle: angle > 180 || angle < 0 ? 0 : angle,
        },
        {
          type: 'line',
          dashArray: [4 / scale],
          points: [start, { x: start.x + r, y: start.y }]
        },
        {
          type: 'text',
          x: (start.x + end.x) / 2 - 20,
          y: (start.y + end.y) / 2 + 4,
          text: r.toFixed(2),
          color: inputMode === 'length' ? 0xff0000 : 0xffcccc,
          fontSize: 16 / scale,
          fontFamily: 'monospace',
        },
        {
          type: 'text',
          x: end.x + 10,
          y: end.y - 10,
          text: `${angle.toFixed(1)}°`,
          color: inputMode === 'angle' ? 0xff0000 : 0xffcccc,
          fontSize: 16 / scale,
          fontFamily: 'monospace',
        },
      )
    }
    if (line) {
      for (const lineSegment of iteratePolylineLines(line)) {
        assistentContents.push({ points: lineSegment, type: 'line' })
      }
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
  hotkey: 'L',
}
