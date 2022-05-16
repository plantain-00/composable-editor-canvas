import { useLineClickCreate } from '../../src'
import { Model } from './model'
import { getPolylineLines, LineContent, lineModel } from './line-model'

export const polylineModel: Model<LineContent> = {
  ...lineModel,
  type: 'polyline',
  explode(content) {
    const { lines } = getPolylineLines(content)
    return lines.map((line) => ({ type: 'line', points: line }))
  },
  useCreate(type, onEnd, getAngleSnap) {
    const { line, onClick, onMove, input } = useLineClickCreate(
      type === 'polyline',
      (c) => onEnd([{ points: c, type: 'polyline' }]),
      {
        getAngleSnap,
      },
    )
    return {
      input,
      onClick,
      onMove,
      updatePreview(contents) {
        if (line) {
          contents.push({ points: line, type: 'polyline' })
        }
      },
    }
  },
}
