import React from "react"
import { arcToPolyline, BooleanEditor, getPointByLengthAndDirection, getTwoPointCenter, getTwoPointsDistance, iteratePolylineLines, Nullable, Position, rotatePositionByCenter } from "../../../src"
import { BaseContent, BaseDevice, deviceGeometryCache, deviceModel, Geometries, getDeviceText, getReference, isJunctionContent, Model } from "../model"

export type SwitchDevice = BaseDevice<'switch'> & {
  on: boolean
}

export function isSwitchDevice(content: BaseContent): content is SwitchDevice {
  return content.type === 'switch'
}

export const switchModel: Model<SwitchDevice> = {
  type: 'switch',
  ...deviceModel,
  render(content, { target, transformStrokeWidth, contents, value }) {
    const strokeWidth = transformStrokeWidth(1)
    const { lines, data } = getSwitchGeometriesFromCache(content, contents)
    const children = lines.map(line => target.renderPolyline(line, { strokeWidth }))
    if (data) {
      children.push(...getDeviceText(data, target, undefined, value))
    }
    return target.renderGroup(children)
  },
  createPreview(p) {
    return {
      type: 'switch',
      start: p.start,
      end: p.end,
      on: false,
    }
  },
  getGeometries: getSwitchGeometriesFromCache,
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="1,46 34,46" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <circle cx="39" cy="47" r="7" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <polyline points="43,41 71,27" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="69,47 100,47" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  ),
  propertyPanel(content, update) {
    return {
      on: <BooleanEditor value={content.on} setValue={(v) => update(c => { if (isSwitchDevice(c)) { c.on = v } })} />,
    }
  },
  getEquationData(content, i) {
    if (content.on) {
      return {
        left: `U${content.start}`,
        right: `U${content.end}`,
        variables: new Set([`U${content.start}`, `U${content.end}`]),
      }
    }
    return {
      left: `I${i}`,
      right: `0`,
      variables: new Set(`I${i}`),
      zero: true,
    }
  },
  getAction(p, content, contents) {
    const { data } = getSwitchGeometriesFromCache(content, contents)
    if (data && getTwoPointsDistance(data.center, p) < 16) {
      return (update) => {
        update(c => {
          if (isSwitchDevice(c)) {
            c.on = !c.on
          }
        })
      }
    }
    return
  },
}

function getSwitchGeometriesFromCache(content: Omit<SwitchDevice, "type">, contents: readonly Nullable<BaseContent>[]): Geometries {
  const start = getReference(content.start, contents, isJunctionContent)
  const end = getReference(content.end, contents, isJunctionContent)
  if (start && end) {
    return deviceGeometryCache.get(content, start, end, () => {
      const center = getTwoPointCenter(start.position, end.position)
      const p1 = getPointByLengthAndDirection(center, 8, start.position)
      const radius = 3
      const lines: [Position, Position][] = [
        [start.position, getPointByLengthAndDirection(p1, radius, start.position)],
        ...iteratePolylineLines(arcToPolyline({ x: p1.x, y: p1.y, r: radius, startAngle: 0, endAngle: 360 }, 5)),
      ]
      if (content.on) {
        lines.push([getPointByLengthAndDirection(p1, radius, end.position), end.position])
      } else {
        const p2 = getPointByLengthAndDirection(center, 8, end.position)
        const p3 = rotatePositionByCenter(p2, p1, 30)
        lines.push(
          [getPointByLengthAndDirection(p1, radius, p3), p3],
          [p2, end.position]
        )
      }

      return {
        lines,
        data: {
          center,
          left: start.position,
          right: end.position,
        },
      }
    })
  }
  return { lines: [] }
}
