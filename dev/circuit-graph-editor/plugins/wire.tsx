import React from "react"
import { Nullable, Position } from "../../../src"
import { BaseContent, BaseDevice, deviceGeometryCache, deviceModel, getReference, isJunctionContent, Model } from "../model"

export type WireDevice = BaseDevice<'wire'>

export function isWireDevice(content: BaseContent): content is WireDevice {
  return content.type === 'wire'
}

export const wireModel: Model<WireDevice> = {
  type: 'wire',
  ...deviceModel,
  render(content, { target, transformStrokeWidth, contents }) {
    const strokeWidth = transformStrokeWidth(1)
    const { lines } = getWireGeometriesFromCache(content, contents)
    return target.renderGroup(lines.map(line => target.renderPolyline(line, { strokeWidth })))
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
  )
}

function getWireGeometriesFromCache(content: Omit<WireDevice, "type">, contents: readonly Nullable<BaseContent>[]) {
  const start = getReference(content.start, contents, isJunctionContent)
  const end = getReference(content.end, contents, isJunctionContent)
  if (start && end) {
    return deviceGeometryCache.get(content, start, end, () => {
      const lines: [Position, Position][] = [
        [start.position, end.position],
      ]
      return {
        lines,
      }
    })
  }
  return { lines: [] }
}
