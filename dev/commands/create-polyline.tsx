import { getTwoPointsDistance, useLineClickCreate } from "../../src";
import { ArcContent } from "../models/arc-model";
import { LineContent } from "../models/line-model";
import { TextContent } from "../models/text-model";
import { Command } from "./command";

export const createPolylineCommand: Command = {
  name: 'create polyline',
  useCommand(onEnd, _, getAngleSnap, type) {
    const { line, onClick, onMove, input } = useLineClickCreate(
      type === 'create polyline',
      (c) => onEnd((contents) => contents.push({ points: c, type: 'polyline' } as LineContent)),
      {
        getAngleSnap,
      },
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
          dashArray: [4],
          startAngle: angle > 180 || angle < 0 ? angle : 0,
          endAngle: angle > 180 || angle < 0 ? 0 : angle,
        },
        {
          type: 'line',
          dashArray: [4],
          points: [start, { x: start.x + r, y: start.y }]
        },
        {
          type: 'text',
          x: (start.x + end.x) / 2 - 20,
          y: (start.y + end.y) / 2 + 4,
          text: r.toFixed(2),
          color: 0xff0000,
          fontSize: 16,
        },
        {
          type: 'text',
          x: end.x + 10,
          y: end.y - 10,
          text: `${angle.toFixed(1)}°`,
          color: 0xff0000,
          fontSize: 16,
        },
      )
    }
    if (line) {
      assistentContents.push({ points: line, type: 'polyline' })
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
