import React from "react"
import { HtmlEditor, HtmlElementNode, useLocalStorageState } from "../src"

export default () => {
  const [, onChange, initialState] = useLocalStorageState<readonly HtmlElementNode[]>('composable-editor-canvas-html-editor', [{
    tag: 'p',
    children: [],
  }])
  return (
    <HtmlEditor
      width={500}
      height={300}
      initialState={initialState}
      onChange={onChange}
    />
  )
}
