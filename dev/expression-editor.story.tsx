import React from "react"
import { ExpressionEditor } from '../src'
import { math } from "./expression/math"
import { validateExpression } from "./expression/validator"

export default () => {
  const [value, setValue] = React.useState('1 + 2 - 3')

  return (
    <ExpressionEditor suggestionSources={math} value={value} setValue={setValue} validate={validateExpression} />
  )
}
