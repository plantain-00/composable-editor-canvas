import React from "react"
import { getPointByLengthAndAngle, getPointByLengthAndDirection, getTwoPointCenter, iteratePolygonLines, Nullable, NumberEditor, Position } from "../../../src"
import { BaseContent, BaseDevice, deviceGeometryCache, deviceModel, Geometries, getDeviceText, getReference, isJunctionContent, Model } from "../model"

export type ResistanceDevice = BaseDevice<'resistance'> & {
  value: number
}

export function isResistanceDevice(content: BaseContent): content is ResistanceDevice {
  return content.type === 'resistance'
}

export const resistanceModel: Model<ResistanceDevice> = {
  type: 'resistance',
  ...deviceModel,
  render(content, { target, transformStrokeWidth, contents, value }) {
    const strokeWidth = transformStrokeWidth(1)
    const { lines, data } = getResistanceGeometriesFromCache(content, contents)
    const children = lines.map(line => target.renderPolyline(line, { strokeWidth }))
    if (data) {
      children.push(...getDeviceText(data, target, content.value + 'Ω', value))
    }
    return target.renderGroup(children)
  },
  createPreview(p) {
    return {
      type: 'resistance',
      start: p.start,
      end: p.end,
      value: 1,
    }
  },
  getGeometries: getResistanceGeometriesFromCache,
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="15" y="35" width="71" height="24" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></rect>
      <polyline points="85,45 99,45" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="13,44 0,44" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  ),
  propertyPanel(content, update) {
    return {
      value: <NumberEditor value={content.value} setValue={(v) => update(c => { if (isResistanceDevice(c)) { c.value = v } })} />
    }
  },
  getEquationData(content, i) {
    return {
      left: `U${content.start} - ${content.value} * I${i}`,
      right: `U${content.end}`,
      variables: new Set([`U${content.start}`, `U${content.end}`, `I${i}`]),
    }
  },
}

function getResistanceGeometriesFromCache(content: Omit<ResistanceDevice, "type">, contents: readonly Nullable<BaseContent>[]): Geometries {
  const start = getReference(content.start, contents, isJunctionContent)
  const end = getReference(content.end, contents, isJunctionContent)
  if (start && end) {
    return deviceGeometryCache.get(content, start, end, () => {
      const center = getTwoPointCenter(start.position, end.position)
      const p1 = getPointByLengthAndDirection(center, 8, start.position)
      const p2 = getPointByLengthAndDirection(center, 8, end.position)
      const angle = Math.atan2(start.position.x - end.position.x, end.position.y - start.position.y)
      const lines: [Position, Position][] = [
        [start.position, p1],
        [end.position, p2],
        ...iteratePolygonLines([
          getPointByLengthAndAngle(p1, 4, angle),
          getPointByLengthAndAngle(p1, -4, angle),
          getPointByLengthAndAngle(p2, -4, angle),
          getPointByLengthAndAngle(p2, 4, angle),
        ])
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
