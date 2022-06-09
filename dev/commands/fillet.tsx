import React from "react"
import { Arc, getCirclesTangentTo2Lines, getFootPoint, getTwoNumbersDistance, getTwoPointsDistance, twoPointLineToGeneralFormLine, useCursorInput, useKey } from "../../src"
import { ArcContent } from "../models/arc-model"
import { isLineContent } from "../models/line-model"
import { BaseContent } from "../models/model"
import { Command } from "./command"

export const filletCommand: Command = {
  name: 'fillet',
  useCommand({ onEnd, type, selected, scale }) {
    const [candidates, setCandidates] = React.useState<Arc[]>([])
    const [result, setResult] = React.useState<Arc>()
    let message = ''
    if (type) {
      if (candidates.length > 0) {
        message = 'select one result'
      } else {
        message = 'input radius'
      }
    }
    const assistentContents: ArcContent[] = candidates.map((c) => ({
      ...c,
      type: 'arc',
      dashArray: c === result ? undefined : [4 / scale],
    }))
    const { input, setInputPosition, setCursorPosition, clearText, resetInput } = useCursorInput(message, type && candidates.length == 0 ? (e, text) => {
      if (e.key === 'Enter') {
        const radius = +text
        if (!isNaN(radius)) {
          setCandidates(getFillets(selected[0].content, selected[1].content, radius))
          clearText()
        }
      }
    } : undefined)
    const reset = () => {
      setCandidates([])
      setResult(undefined)
      clearText()
      resetInput()
    }
    useKey((e) => e.key === 'Escape', reset, [setCandidates])

    return {
      onStart(p) {
        setCursorPosition(p)
        if (result) {
          onEnd((contents) => {
            contents.push({ type: 'arc', ...result } as ArcContent)
          })
          setCandidates([])
        }
      },
      input,
      onMove(p, viewportPosition) {
        setCursorPosition(p)
        setInputPosition(viewportPosition || p)
        setResult(candidates.find((c) => getTwoNumbersDistance(getTwoPointsDistance(c, p), c.r) < 5))
      },
      assistentContents,
    }
  },
  selectCount: 2,
  contentSelectable: (c) => isLineContent(c),
  selectType: 'select part',
  hotkey: 'F',
}

function getFillets(content1: BaseContent, content2: BaseContent, radius: number) {
  const result: Arc[] = []
  if (isLineContent(content1) && isLineContent(content2)) {
    result.push(...getCirclesTangentTo2Lines(content1.points[0], content1.points[1], content2.points[0], content2.points[1], radius).map((c) => {
      const foot1 = getFootPoint(c, twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]))
      const foot2 = getFootPoint(c, twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]))
      const angle1 = Math.atan2(foot1.y - c.y, foot1.x - c.x) * 180 / Math.PI
      const angle2 = Math.atan2(foot2.y - c.y, foot2.x - c.x) * 180 / Math.PI
      const min = Math.min(angle1, angle2)
      const max = Math.max(angle1, angle2)
      if (max - min < 180) {
        return { ...c, r: radius, startAngle: min, endAngle: max }
      }
      return { ...c, r: radius, startAngle: max, endAngle: min + 360 }
    }))
  }
  return result
}
