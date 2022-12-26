import { getPointByLengthAndAngle, getPointByLengthAndDirection, getPointsBounding, getTwoPointCenter, Nullable, Position } from "../../../src"
import { BaseContent, BaseDevice, deviceGeometryCache, getReference, isJunctionContent, Model } from "../model"

export type PowerDevice = BaseDevice<'power'> & {
  value: number
}

export function isPowerDevice(content: BaseContent): content is PowerDevice {
  return content.type === 'power'
}

export const powerModel: Model<PowerDevice> = {
  type: 'power',
  render(content, { target, transformStrokeWidth, contents }) {
    const strokeWidth = transformStrokeWidth(1)
    const { lines } = getPowerGeometriesFromCache(content, contents)
    return target.renderGroup(lines.map(line => target.renderPolyline(line, { strokeWidth })))
  },
  createPreview(p) {
    return {
      type: 'power',
      start: p.start,
      end: p.end,
      value: 1,
    }
  },
}

function getPowerGeometriesFromCache(content: Omit<PowerDevice, "type">, contents: readonly Nullable<BaseContent>[]) {
  const start = getReference(content.start, contents, isJunctionContent)
  const end = getReference(content.end, contents, isJunctionContent)
  if (start && end) {
    return deviceGeometryCache.get(content, start, end, () => {
      const center = getTwoPointCenter(start.position, end.position)
      const p1 = getPointByLengthAndDirection(center, 3, start.position)
      const p2 = getPointByLengthAndDirection(center, 3, end.position)
      const angle = Math.atan2(start.position.x - end.position.x, end.position.y - start.position.y)
      const lines: [Position, Position][] = [
        [start.position, p1],
        [end.position, p2],
        [getPointByLengthAndAngle(p1, 4, angle), getPointByLengthAndAngle(p1, -4, angle)],
        [getPointByLengthAndAngle(p2, 8, angle), getPointByLengthAndAngle(p2, -8, angle)],
      ]
      return {
        lines,
        bounding: getPointsBounding([start.position, end.position]),
      }
    })
  }
  return { lines: [] }
}
