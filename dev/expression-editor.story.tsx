import React from "react"
import { ExpressionEditor, validateExpression } from '../src'
import { math } from "./expression/math"

export default () => {
  const [value, setValue] = React.useState('1 + 2 - 3')

  return (
    <ExpressionEditor suggestionSources={math} value={value} setValue={setValue} validate={validateExpression} />
  )
}
