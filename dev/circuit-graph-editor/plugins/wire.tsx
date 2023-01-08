import React from "react"
import { getTwoPointCenter, Nullable, Position } from "../../../src"
import { BaseContent, BaseDevice, deviceGeometryCache, deviceModel, Geometries, getDeviceText, getReference, isJunctionContent, Model } from "../model"

export type WireDevice = BaseDevice<'wire'>

export function isWireDevice(content: BaseContent): content is WireDevice {
  return content.type === 'wire'
}

export const wireModel: Model<WireDevice> = {
  type: 'wire',
  ...deviceModel,
  render(content, { target, transformStrokeWidth, contents, value }) {
    const strokeWidth = transformStrokeWidth(1)
    const { lines, data } = getWireGeometriesFromCache(content, contents)
    const children = lines.map(line => target.renderPolyline(line, { strokeWidth }))
    if (data) {
      children.push(...getDeviceText(data, target, undefined, value))
    }
    return target.renderGroup(children)
  },
  createPreview(p) {
    return {
      type: 'wire',
      start: p.start,
      end: p.end,
    }
  },
  getGeometries: getWireGeometriesFromCache,
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="1,46 100,46" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
    </svg>
  ),
  getEquationData(content) {
    return {
      left: `U${content.start}`,
      right: `U${content.end}`,
    }
  },
}

function getWireGeometriesFromCache(content: Omit<WireDevice, "type">, contents: readonly Nullable<BaseContent>[]): Geometries {
  const start = getReference(content.start, contents, isJunctionContent)
  const end = getReference(content.end, contents, isJunctionContent)
  if (start && end) {
    return deviceGeometryCache.get(content, start, end, () => {
      const center = getTwoPointCenter(start.position, end.position)
      const lines: [Position, Position][] = [
        [start.position, end.position],
      ]
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
