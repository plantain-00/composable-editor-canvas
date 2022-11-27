import React from "react"
import { HtmlEditor } from "../src"

export default () => {
  return (
    <HtmlEditor
      width={500}
      height={300}
      initialState={[{
        tag: 'p',
        children: [],
      }]}
    />
  )
}
