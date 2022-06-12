import React from "react";
import { Position, useKey } from "../../src";
import { LineContent } from "../models/line-model";
import { LinearDimensionContent } from "../models/linear-dimension-model";
import { Command } from "./command";

export const createLinearDimensionCommand: Command = {
  name: 'create linear dimension',
  selectCount: 0,
  useCommand({ onEnd, type, scale }) {
    const [p1, setP1] = React.useState<Position>()
    const [p2, setP2] = React.useState<Position>()
    const [cursorPosition, setCursorPosition] = React.useState<Position>()
    const [result, setResult] = React.useState<LinearDimensionContent>()
    const reset = () => {
      setP1(undefined)
      setP2(undefined)
      setResult(undefined)
    }
    useKey((e) => e.key === 'Escape', reset, [setResult])
    const assistentContents: (LinearDimensionContent | LineContent)[] = []
    if (result) {
      assistentContents.push(result)
    } else if (p1 && cursorPosition) {
      assistentContents.push({ type: 'line', points: [p1, cursorPosition], dashArray: [4 / scale] })
    }
    return {
      onStart(p) {
        if (!p1) {
          setP1(p)
        } else if (!p2) {
          setP2(p)
        } else if (result) {
          onEnd(
            (contents) => {
              contents.push(result)
            },
            type,
          )
          reset()
        }
      },
      onMove(p) {
        setCursorPosition(p)
        if (type && p1 && p2) {
          setResult({
            type: 'linear dimension',
            position: p,
            p1,
            p2,
            fontSize: 16,
            fontFamily: 'monospace',
          })
        }
      },
      assistentContents,
    }
  },
}
