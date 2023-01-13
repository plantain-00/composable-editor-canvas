import { Expression2 as Expression, priorizedBinaryOperators } from "expression-engine"
import { Size } from "../utils/geometry"
import { getTextSizeFromCache } from "../utils/text"
import { ReactRenderTarget } from "./react-render-target/react-render-target"

export function renderEquation(
  target: ReactRenderTarget<unknown>,
  equation: Equation,
  renderOptions: Partial<ExpressionRendererOptions> = {},
) {
  const options = { ...defaultExpressionRenderOptions, ...renderOptions }
  const { children, render, font } = createExpressionRenderer(target, options.color, options.fontSize, options.fontFamily, options.paddingOperator, options.keepBinaryExpressionOrder)
  const left = render(equation.left)
  const right = render(equation.right)
  let result: JSX.Element | undefined
  if (left && right) {
    const equal = ' = '
    const size = getTextSizeFromCache(font, equal)
    if (size) {
      const width = left.size.width + size.width + right.size.width
      const height = Math.max(left.size.height, size.height, right.size.height)
      const canvasWidth = width + options.paddingX * 2
      const canvasHeight = height + options.paddingY * 2
      const x = canvasWidth / 2
      const y = canvasHeight / 2
      let startX = x - width / 2
      left.render(startX + left.size.width / 2, y)
      startX += left.size.width
      children.push(target.renderText(startX + size.width / 2, y, equal, options.color, options.fontSize, options.fontFamily, { textBaseline: 'middle', textAlign: 'center' }))
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
  renderOptions: Partial<ExpressionRendererOptions> = {},
) {
  const options = { ...defaultExpressionRenderOptions, ...renderOptions }
  const { children, render } = createExpressionRenderer(target, options.color, options.fontSize, options.fontFamily, options.paddingOperator, options.keepBinaryExpressionOrder)
  const r = render(expression)
  let result: JSX.Element | undefined
  if (r) {
    const width = r.size.width + options.paddingX * 2
    const height = r.size.height + options.paddingY * 2
    r.render(width / 2, height / 2)
    result = target.renderResult(children, width, height)
  }
  return result
}

interface ExpressionRendererOptions {
  keepBinaryExpressionOrder: boolean
  color: number,
  fontSize: number,
  fontFamily: string,
  paddingX: number,
  paddingY: number,
  paddingOperator: number,
}

const defaultExpressionRenderOptions: ExpressionRendererOptions = {
  color: 0x000000,
  fontSize: 20,
  fontFamily: 'monospace',
  paddingX: 10,
  paddingY: 10,
  paddingOperator: 5,
  keepBinaryExpressionOrder: false,
}

function createExpressionRenderer(
  target: ReactRenderTarget<unknown>,
  color: number,
  fontSize: number,
  fontFamily: string,
  paddingOperator: number,
  keepBinaryExpressionOrder: boolean,
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
          if (e.right.type === 'NumericLiteral' && e.right.value === 0.5) {
            const width = left.size.width + paddingOperator * 2
            const height = left.size.height + paddingOperator
            return {
              size: {
                width,
                height,
              },
              render(x, y) {
                left.render(x + paddingOperator, y + paddingOperator / 2)
                children.push(target.renderPolyline([
                  { x: x + width / 2, y: y - height / 2 },
                  { x: x - width / 2 + paddingOperator * 2, y: y - height / 2 },
                  { x: x - width / 2 + paddingOperator, y: y + height / 2 },
                  { x: x - width / 2, y: y + height / 2 - paddingOperator },
                ], { strokeColor: color, strokeWidth: 1 }))
              },
            }
          }
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
          if (index > priority || (index === priority && keepBinaryExpressionOrder)) {
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

export interface Equation {
  left: Expression
  right: Expression
}
