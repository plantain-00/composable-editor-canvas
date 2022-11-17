import React from "react"
import { ExpressionEditor } from '../src'
import { math } from "./math"

export default () => {
  const [value, setValue] = React.useState('1 + 2 = 3')

  return (
    <ExpressionEditor suggestionSources={math} value={value} setValue={setValue} />
  )
}
