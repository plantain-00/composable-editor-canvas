import * as React from "react"

export function useHovering<T extends string | number>() {
  const [hovering, setHovering] = React.useState<T>()

  const isHovering = (value: T) => hovering === value

  return {
    hovering,
    isHovering,
    setHovering,
  }
}
