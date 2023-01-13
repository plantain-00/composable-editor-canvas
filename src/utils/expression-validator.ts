import { ExpressionError, parseExpression, tokenizeExpression } from "expression-engine";

export function validateExpression(text: string): [number, number] | undefined {
  try {
    parseExpression(tokenizeExpression(text))
  } catch (error) {
    if (error instanceof ExpressionError) {
      return error.range
    }
  }
  return
}
