import * as React from "react"

export function useHoverPart<T extends string | number>() {
  const [hovering, setHovering] = React.useState<T | readonly [T, number]>()

  const isHovering = (value: T | readonly [T, number]) => {
    if (hovering === undefined) {
      return false
    }
    if (typeof hovering === 'number' || typeof hovering === 'string') {
      return hovering === value
    }
    if (typeof value === 'number' || typeof value === 'string') {
      if (hovering[0] === value) {
        return hovering[1]
      }
      return false
    }
    if (hovering[0] === value[0]) {
      if (hovering[1] === value[1]) {
        return true
      }
      return value[1]
    }
    return false
  }

  return {
    hovering,
    isHovering,
    setHovering,
  }
}
