import React from "react"
import { Button, getPointByLengthAndRadian, getPointByLengthAndDirection, getTwoPointCenter, getTwoPointsRadian, Nullable, NumberEditor, Position } from "../../../src"
import { BaseContent, BaseDevice, deviceGeometryCache, deviceModel, Geometries, getDeviceText, getReference, isJunctionContent, Model } from "../model"

export type PowerDevice = BaseDevice<'power'> & {
  value: number
}

export function isPowerDevice(content: BaseContent): content is PowerDevice {
  return content.type === 'power'
}

export const powerModel: Model<PowerDevice> = {
  type: 'power',
  ...deviceModel,
  render(content, { target, transformStrokeWidth, contents, value }) {
    const strokeWidth = transformStrokeWidth(1)
    const { lines, data } = getPowerGeometriesFromCache(content, contents)
    const children = lines.map(line => target.renderPolyline(line, { strokeWidth }))
    if (data) {
      children.push(...getDeviceText(data, target, content.value + 'V', value))
    }
    return target.renderGroup(children)
  },
  createPreview(p) {
    return {
      type: 'power',
      start: p.start,
      end: p.end,
      value: 1,
    }
  },
  getGeometries: getPowerGeometriesFromCache,
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="9,48 37,48" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="36,66 36,32" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="96,48 64,48" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <polyline points="64,75 64,22" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  ),
  propertyPanel(content, update) {
    return {
      value: <NumberEditor value={content.value} setValue={(v) => update(c => { if (isPowerDevice(c)) { c.value = v } })} />,
      direction: <Button onClick={() => update(c => {
        if (isPowerDevice(c)) {
          const a = c.end
          c.end = c.start
          c.start = a
        }
      })}>switch</Button>,
    }
  },
  getEquationData(content) {
    return {
      left: `U${content.start} + ${content.value}`,
      right: `U${content.end}`,
    }
  },
}

function getPowerGeometriesFromCache(content: Omit<PowerDevice, "type">, contents: readonly Nullable<BaseContent>[]): Geometries {
  const start = getReference(content.start, contents, isJunctionContent)
  const end = getReference(content.end, contents, isJunctionContent)
  if (start && end) {
    return deviceGeometryCache.get(content, start, end, () => {
      const center = getTwoPointCenter(start.position, end.position)
      const p1 = getPointByLengthAndDirection(center, 3, start.position)
      const p2 = getPointByLengthAndDirection(center, 3, end.position)
      const radian = getTwoPointsRadian(start.position, end.position) + Math.PI / 2
      const lines: [Position, Position][] = [
        [start.position, p1],
        [end.position, p2],
        [getPointByLengthAndRadian(p1, 4, radian), getPointByLengthAndRadian(p1, -4, radian)],
        [getPointByLengthAndRadian(p2, 8, radian), getPointByLengthAndRadian(p2, -8, radian)],
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
