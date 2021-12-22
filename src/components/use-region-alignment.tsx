import * as React from "react"

export function useRegionAlignment(delta: number) {
  const [alignmentX, setAlignmentX] = React.useState<number>()
  const [alignmentY, setAlignmentY] = React.useState<number>()

  return {
    alignmentX,
    alignmentY,
    changeOffsetByAlignment(
      offset: { x: number, y: number },
      target: { x: number, y: number, width: number, height: number },
      regions: { x: number, y: number, width: number, height: number }[]
    ) {
      const region = getRegionAlignment(offset, delta, target, regions)
      if (region.x !== undefined) {
        offset.x = region.x.target
        setAlignmentX(region.x.alignment)
      } else {
        setAlignmentX(undefined)
      }
      if (region.y !== undefined) {
        offset.y = region.y.target
        setAlignmentY(region.y.alignment)
      } else {
        setAlignmentY(undefined)
      }
    },
    clearAlignments() {
      setAlignmentX(undefined)
      setAlignmentY(undefined)
    },
  }
}

function getRegionAlignment(
  offset: { x: number, y: number },
  delta: number,
  target: { x: number, y: number, width: number, height: number },
  regions: { x: number, y: number, width: number, height: number }[]
) {
  const x = target.x + offset.x
  const y = target.y + offset.y
  const result: {
    x?: {
      target: number
      alignment: number
    }
    y?: {
      target: number
      alignment: number
    }
  } = {}
  for (const { field, value, sizeField } of [{ field: 'x', value: x, sizeField: 'width' }, { field: 'y', value: y, sizeField: 'height' }] as const) {
    let region = regions.find((r) => Math.abs(r[field] - value) < delta)
    if (region) {
      result[field] = {
        target: region[field] - target[field],
        alignment: region[field],
      }
    } else {
      const newX = value + target[sizeField] / 2
      region = regions.find((r) => Math.abs(r[field] + r[sizeField] / 2 - newX) < delta)
      if (region) {
        result[field] = {
          target: region[field] + (region[sizeField] - target[sizeField]) / 2 - target[field],
          alignment: region[field] + region[sizeField] / 2,
        }
      } else {
        const newX = value + target[sizeField]
        region = regions.find((r) => Math.abs(r[field] + r[sizeField] - newX) < delta)
        if (region) {
          result[field] = {
            target: region[field] + region[sizeField] - target[sizeField] - target[field],
            alignment: region[field] + region[sizeField],
          }
        }
      }
    }
  }
  return result
}
