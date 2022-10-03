import { useLineClickCreate } from "../../src";
import { LineContent } from "../models/line-model";
import { SplineContent } from "../models/spline-model";
import { Command } from "./command";

export const createSplineCommand: Command = {
  name: 'create spline',
  type: [
    { name: 'spline', hotkey: 'SPL' },
    { name: 'spline fitting' },
  ],
  useCommand({ onEnd, getAngleSnap, type, scale }) {
    const { line, onClick, onMove, input, lastPosition } = useLineClickCreate(
      type === 'spline' || type === 'spline fitting',
      (c) => onEnd({
        updateContents: (contents) => contents.push({ points: c, type: 'spline', fitting: type === 'spline fitting' } as SplineContent)
      }),
      {
        getAngleSnap,
      },
    )
    const assistentContents: (SplineContent | LineContent)[] = []
    if (line) {
      assistentContents.push(
        { points: line, type: 'spline', fitting: type === 'spline fitting' },
        { points: line, type: 'polyline', dashArray: [4 / scale] }
      )
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
}
