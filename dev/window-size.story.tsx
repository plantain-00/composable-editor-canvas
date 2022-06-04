import React from "react"
import { useWindowSize } from "../src"

export default () => {
  const { width, height } = useWindowSize()

  return (
    <div>
      {Math.round(width)} {Math.round(height)}
    </div>
  )
}
