import React from "react"
import { ImageEditor, useWindowSize } from "../src"

export default () => {
  const size = useWindowSize()
  return (
    <ImageEditor
      src='https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg'
      width={size.width / 2}
      height={size.height}
    />
  )
}
