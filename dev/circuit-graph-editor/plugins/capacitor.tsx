import React from "react"
import { getPointByLengthAndAngle, getPointByLengthAndDirection, getTwoPointCenter, Nullable, NumberEditor, Position } from "../../../src"
import { BaseContent, BaseDevice, deviceGeometryCache, deviceModel, Geometries, getDeviceText, getReference, isJunctionContent, Model } from "../model"

export type CapacitorDevice = BaseDevice<'capacitor'> & {
  value: number
}

export function isCapacitorDevice(content: BaseContent): content is CapacitorDevice {
  return content.type === 'capacitor'
}

export const capacitorModel: Model<CapacitorDevice> = {
  type: 'capacitor',
  ...deviceModel,
  render(content, { target, transformStrokeWidth, contents, value, equationResult }) {
    const strokeWidth = transformStrokeWidth(1)
    const { lines, data } = getCapacitorGeometriesFromCache(content, contents)
    const children = lines.map(line => target.renderPolyline(line, { strokeWidth }))
    if (data) {
      if (equationResult && typeof content.start === 'number' && typeof content.end === 'number') {
        const startResult = equationResult[content.start]
        const endResult = equationResult[content.end]
        if (startResult !== undefined && endResult !== undefined) {
          value = (endResult - startResult) * content.value
        }
      }
      children.push(...getDeviceText(data, target, content.value + 'F', value, 'C'))
    }
    return target.renderGroup(children)
  },
  createPreview(p) {
    return {
      type: 'capacitor',
      start: p.start,
      end: p.end,
      value: 1,
    }
  },
  getGeometries: getCapacitorGeometriesFromCache,
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="9,48 37,48" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="36,75 36,22" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="96,48 64,48" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="64,75 64,22" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  ),
  propertyPanel(content, update) {
    return {
      value: <NumberEditor value={content.value} setValue={(v) => update(c => { if (isCapacitorDevice(c)) { c.value = v } })} />,
    }
  },
  getEquationData(_, i) {
    return {
      left: `I${i}`,
      right: `0`,
    }
  },
}

function getCapacitorGeometriesFromCache(content: Omit<CapacitorDevice, "type">, contents: readonly Nullable<BaseContent>[]): Geometries {
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
        [getPointByLengthAndAngle(p1, 8, angle), getPointByLengthAndAngle(p1, -8, angle)],
        [getPointByLengthAndAngle(p2, 8, angle), getPointByLengthAndAngle(p2, -8, angle)],
      ]
      return {
        data: {
          center,
          left: start.position,
          right: end.position,
        },
        lines,
      }
    })
  }
  return { lines: [] }
}
