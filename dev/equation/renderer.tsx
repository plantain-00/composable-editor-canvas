import { Expression2 as Expression, postfixUnaryOperators, priorizedBinaryOperators } from "expression-engine"
import { getTextSizeFromCache, ReactRenderTarget, Size } from "../../src"
import { Equation } from "./model"

export function renderEquation(
  target: ReactRenderTarget<unknown>,
  equation: Equation,
  color: number,
  fontSize: number,
  fontFamily: string,
  paddingX: number,
  paddingY: number,
  paddingOperator: number,
  options?: Partial<ExpressionRendererOptions>,
) {
  const { children, render, font } = createExpressionRenderer(target, color, fontSize, fontFamily, paddingOperator, options)
  const left = render(equation.left)
  const right = render(equation.right)
  let result: JSX.Element | undefined
  if (left && right) {
    const equal = ' = '
    const size = getTextSizeFromCache(font, equal)
    if (size) {
      const width = left.size.width + size.width + right.size.width
      const height = Math.max(left.size.height, size.height, right.size.height)
      const canvasWidth = width + paddingX * 2
      const canvasHeight = height + paddingY * 2
      const x = canvasWidth / 2
      const y = canvasHeight / 2
      let startX = x - width / 2
      left.render(startX + left.size.width / 2, y)
      startX += left.size.width
      children.push(target.renderText(startX + size.width / 2, y, equal, color, fontSize, fontFamily, { textBaseline: 'middle', textAlign: 'center' }))
      startX += size.width
      right.render(startX + right.size.width / 2, y)
      result = target.renderResult(children, canvasWidth, canvasHeight, {
        attributes: {
          style: {
            width: '100%',
          }
        }
      })
    }
  }
  return result
}

export function renderExpression(
  target: ReactRenderTarget<unknown>,
  expression: Expression,
  color: number,
  fontSize: number,
  fontFamily: string,
  paddingX: number,
  paddingY: number,
  paddingOperator: number,
  options?: Partial<ExpressionRendererOptions>,
) {
  const { children, render } = createExpressionRenderer(target, color, fontSize, fontFamily, paddingOperator, options)
  const r = render(expression)
  let result: JSX.Element | undefined
  if (r) {
    const width = r.size.width + paddingX * 2
    const height = r.size.height + paddingY * 2
    r.render(width / 2, height / 2)
    result = target.renderResult(children, width, height)
  }
  return result
}

interface ExpressionRendererOptions {
  keepBinaryExpressionOrder: boolean
}

function createExpressionRenderer(
  target: ReactRenderTarget<unknown>,
  color: number,
  fontSize: number,
  fontFamily: string,
  paddingOperator: number,
  options?: Partial<ExpressionRendererOptions>,
) {
  const children: unknown[] = []
  const font = `${fontSize}px ${fontFamily}`
  const render = (e: Expression, priority = Number.MAX_SAFE_INTEGER, scale = 1, isPartial = false): { size: Size, render: (x: number, y: number) => void } | void => {
    const scaledFontSize = fontSize * scale
    const scaledFont = scale === 1 ? font : `${scaledFontSize}px ${fontFamily}`
    if (e.type === 'BinaryExpression') {
      const index = e.operator === '/' ? Number.MAX_SAFE_INTEGER : priorizedBinaryOperators.findIndex(p => p.includes(e.operator))
      const left = render(e.left, index, scale)
      const right = render(e.right, e.operator === '+' || e.operator === '*' ? index : index - 0.1, e.operator === '**' ? scale * 0.75 : scale)
      if (left && right) {
        if (e.operator === '**') {
          const width = left.size.width + right.size.width
          const height = left.size.height + right.size.height / 2
          return {
            size: {
              width,
              height,
            },
            render(x, y) {
              left.render(x - width / 2 + left.size.width / 2, y + height / 2 - left.size.height / 2 - right.size.height / 4)
              right.render(x - width / 2 + left.size.width + right.size.width / 2, y - height / 2 + right.size.height / 2)
            },
          }
        }
        if (e.operator === '/') {
          const width = Math.max(left.size.width, right.size.width) + paddingOperator * 2
          const height = left.size.height + paddingOperator * 2 + right.size.height
          return {
            size: {
              width,
              height,
            },
            render(x, y) {
              left.render(x, y - paddingOperator - left.size.height / 2)
              children.push(target.renderPolyline([{ x: x - width / 2, y }, { x: x + width / 2, y }], { strokeColor: color, strokeWidth: 1 }))
              right.render(x, y + paddingOperator + right.size.height / 2)
            },
          }
        }
        const operator = e.operator === '*' ? '' : e.operator
        const size = getTextSizeFromCache(scaledFont, operator)
        if (size) {
          let width = left.size.width + size.width + right.size.width + paddingOperator * (size.width ? 2 : 0)
          const height = Math.max(left.size.height, size.height, right.size.height)
          let groupSize: Size | undefined
          const groupFontSize = Math.max(height, scaledFontSize)
          if (index > priority || (index === priority && options?.keepBinaryExpressionOrder)) {
            groupSize = getTextSizeFromCache(`${groupFontSize}px ${fontFamily}`, '(')
          }
          if (groupSize) {
            width += groupSize.width * 2
          }
          return {
            size: {
              width,
              height,
            },
            render(x, y) {
              let startX = x - width / 2
              if (groupSize) {
                children.push(target.renderText(startX + groupSize.width / 2, y, '(', color, groupFontSize, fontFamily, { textBaseline: 'middle', textAlign: 'center' }))
                startX += groupSize.width
              }
              left.render(startX + left.size.width / 2, y)
              startX += left.size.width
              if (size.width) {
                startX += paddingOperator
                children.push(target.renderText(startX + size.width / 2, y, operator, color, scaledFontSize, fontFamily, { textBaseline: 'middle', textAlign: 'center' }))
                startX += size.width + paddingOperator
              }
              right.render(startX + right.size.width / 2, y)
              if (groupSize) {
                startX += right.size.width
                children.push(target.renderText(startX + groupSize.width / 2, y, ')', color, groupFontSize, fontFamily, { textBaseline: 'middle', textAlign: 'center' }))
              }
            },
          }
        }
      }
      return
    }
    if (e.type === 'UnaryExpression') {
      const size = getTextSizeFromCache(font, e.operator)
      const argument = render(e.argument, -1, scale)
      if (size && argument) {
        const width = size.width + argument.size.width
        return {
          size: {
            width,
            height: Math.max(size.height, argument.size.height),
          },
          render(x, y) {
            children.push(target.renderText(x - width / 2 + size.width / 2, y, e.operator, color, scaledFontSize, fontFamily, { textBaseline: 'middle', textAlign: 'center' }))
            argument.render(x - width / 2 + size.width + argument.size.width / 2, y)
          },
        }
      }
      return
    }
    let text: string | undefined
    if (e.type === 'Identifier') {
      if (!isPartial && e.name.length > 1) {
        const left = render({ type: 'Identifier', name: e.name[0] }, undefined, scale)
        const right = render({ type: 'Identifier', name: e.name.substring(1) }, undefined, scale * 0.75, true)
        if (left && right) {
          const width = left.size.width + right.size.width
          const height = left.size.height + right.size.height / 2
          return {
            size: {
              width,
              height,
            },
            render(x, y) {
              left.render(x - width / 2 + left.size.width / 2, y - height / 2 + left.size.height / 2 + right.size.height / 4)
              right.render(x - width / 2 + left.size.width + right.size.width / 2, y + height / 2 - right.size.height / 2)
            },
          }
        }
      }
      text = e.name
    } else if (e.type === 'NumericLiteral') {
      text = e.value.toString()
    }
    if (text) {
      const size = getTextSizeFromCache(font, text)
      if (size) {
        const name = text
        return {
          size,
          render: (x: number, y: number) => children.push(target.renderText(x, y, name, color, scaledFontSize, fontFamily, { textBaseline: 'middle', textAlign: 'center' })),
        }
      }
    }
  }
  return {
    font,
    children,
    render,
  }
}

export function printExpression(expression: Expression, options?: Partial<{
  keepBinaryExpressionOrder: boolean
}>): string {
  const print = (expression: Expression, priority = Number.MAX_SAFE_INTEGER): string => {
    if (expression.type === 'NumericLiteral') {
      return expression.value.toString()
    }
    if (expression.type === 'StringLiteral') {
      return `'${expression.value}'`
    }
    if (expression.type === 'Identifier') {
      return expression.name
    }
    if (expression.type === 'UnaryExpression') {
      const argument = print(expression.argument, -1)
      if (postfixUnaryOperators.includes(expression.operator)) {
        return argument + expression.operator
      }
      if (expression.operator === 'await') {
        return expression.operator + ' ' + argument
      }
      return expression.operator + argument
    }
    if (expression.type === 'BinaryExpression' || expression.type === 'LogicalExpression') {
      const index = priorizedBinaryOperators.findIndex(p => p.includes(expression.operator))
      const rightIndex = expression.operator === '+' || expression.operator === '*' ? index : index - 0.1
      const result = print(expression.left, index) + ' ' + expression.operator + ' ' + print(expression.right, rightIndex)
      if (index > priority || (index === priority && options?.keepBinaryExpressionOrder)) {
        return `(${result})`
      }
      return result
    }
    if (expression.type === 'ConditionalExpression') {
      return print(expression.test) + ' ? ' + print(expression.consequent) + ' : ' + print(expression.alternate)
    }
    return ''
  }
  return print(expression)
}
