import { getPointByLengthAndAngle, getPointByLengthAndDirection, getPointsBounding, getTwoPointCenter, Nullable, Position } from "../../../src"
import { BaseContent, BaseDevice, deviceGeometryCache, getReference, isJunctionContent, Model } from "../model"

export type ResistanceDevice = BaseDevice<'resistance'> & {
  value: number
}

export function isResistanceDevice(content: BaseContent): content is ResistanceDevice {
  return content.type === 'resistance'
}
export const resistanceModel: Model<ResistanceDevice> = {
  type: 'resistance',
  render(content, { target, transformStrokeWidth, contents }) {
    const strokeWidth = transformStrokeWidth(1)
    const { lines } = getResistanceGeometriesFromCache(content, contents)
    return target.renderGroup(lines.map(line => target.renderPolyline(line, { strokeWidth })))
  },
  createPreview(p) {
    return {
      type: 'resistance',
      start: p.start,
      end: p.end,
      value: 1,
    }
  },
}

function getResistanceGeometriesFromCache(content: Omit<ResistanceDevice, "type">, contents: readonly Nullable<BaseContent>[]) {
  const start = getReference(content.start, contents, isJunctionContent)
  const end = getReference(content.end, contents, isJunctionContent)
  if (start && end) {
    return deviceGeometryCache.get(content, start, end, () => {
      const center = getTwoPointCenter(start.position, end.position)
      const p1 = getPointByLengthAndDirection(center, 8, start.position)
      const p2 = getPointByLengthAndDirection(center, 8, end.position)
      const angle = Math.atan2(start.position.x - end.position.x, end.position.y - start.position.y)
      const p3 = getPointByLengthAndAngle(p1, 4, angle)
      const p4 = getPointByLengthAndAngle(p1, -4, angle)
      const p5 = getPointByLengthAndAngle(p2, 4, angle)
      const p6 = getPointByLengthAndAngle(p2, -4, angle)
      const lines: [Position, Position][] = [
        [start.position, p1],
        [end.position, p2],
        [p3, p4],
        [p3, p5],
        [p5, p6],
        [p4, p6],
      ]
      return {
        lines,
        bounding: getPointsBounding([start.position, end.position]),
      }
    })
  }
  return { lines: [] }
}
