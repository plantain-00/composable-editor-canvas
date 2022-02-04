import * as React from "react"

export function useRegionAlignment(delta: number) {
  const [regionAlignmentX, setRegionAlignmentX] = React.useState<number>()
  const [regionAlignmentY, setRegionAlignmentY] = React.useState<number>()

  return {
    regionAlignmentX,
    regionAlignmentY,
    changeOffsetByRegionAlignment(
      offset: { x: number, y: number },
      target: { x: number, y: number, width: number, height: number },
      regions: { x: number, y: number, width: number, height: number }[]
    ) {
      const region = getRegionAlignment(offset, delta, target, regions)
      if (region.x !== undefined) {
        offset.x = region.x.target
        setRegionAlignmentX(region.x.alignment)
      } else {
        setRegionAlignmentX(undefined)
      }
      if (region.y !== undefined) {
        offset.y = region.y.target
        setRegionAlignmentY(region.y.alignment)
      } else {
        setRegionAlignmentY(undefined)
      }
    },
    clearRegionAlignments() {
      setRegionAlignmentX(undefined)
      setRegionAlignmentY(undefined)
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
      const newValue = value + target[sizeField] / 2
      region = regions.find((r) => Math.abs(r[field] + r[sizeField] / 2 - newValue) < delta)
      if (region) {
        result[field] = {
          target: region[field] + (region[sizeField] - target[sizeField]) / 2 - target[field],
          alignment: region[field] + region[sizeField] / 2,
        }
      } else {
        const newValue = value + target[sizeField]
        region = regions.find((r) => Math.abs(r[field] + r[sizeField] - newValue) < delta)
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
