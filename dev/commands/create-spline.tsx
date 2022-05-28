import { useLineClickCreate } from "../../src";
import { LineContent } from "../models/line-model";
import { SplineContent } from "../models/spline-model";
import { Command } from "./command";

export const createSplineCommand: Command = {
  name: 'create spline',
  type: ['spline', 'spline fitting'],
  useCommand(onEnd, _, getAngleSnap, type) {
    const { line, onClick, onMove, input } = useLineClickCreate(
      type === 'spline' || type === 'spline fitting',
      (c) => onEnd((contents) => contents.push({ points: c, type: 'spline', fitting: type === 'spline fitting' } as SplineContent)),
      {
        getAngleSnap,
      },
    )
    const assistentContents: (SplineContent | LineContent)[] = []
    if (line) {
      assistentContents.push(
        { points: line, type: 'spline', fitting: type === 'spline fitting' },
        { points: line, type: 'polyline', dashArray: [4] }
      )
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
