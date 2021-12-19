import { evaluateExpression, Expression, parseExpression, tokenizeExpression } from 'expression-engine'
import { Position, PositionExpression, Region, Rotate, RotateExpression, Size, SizeExpression, StyleGuide, Template, TemplateContent, TemplateReferenceContent } from "./model"

export function selectContentOrTemplateByPosition(styleGuide: StyleGuide, position: Position) {
  const generator = iterateContentOrTemplateByPosition(styleGuide, position)
  const result = generator.next()
  return result.done ? undefined : result.value
}

function* iterateContentOrTemplateByPosition(styleGuide: StyleGuide, position: Position): Generator<ContentOrTemplateRegion, void, unknown> {
  const targetContentRegions = sortByZ(Array.from(iterateAllContentRegions(undefined, styleGuide)))
  for (const contentRegion of targetContentRegions) {
    if (isInRegion(position, contentRegion)) {
      yield { kind: 'content', region: contentRegion }
    }
  }

  for (const contentRegion of iterateTemplateRegionByPosition(styleGuide, position)) {
    yield { kind: 'template', region: contentRegion }
  }
}

function* iterateAllContentRegions(
  target: TemplateContent | undefined,
  styleGuide: StyleGuide,
  targetTemplate?: Template,
) {
  if (targetTemplate) {
    yield* iterateAllContent(target, targetTemplate, targetTemplate, { x: targetTemplate.x, y: targetTemplate.y, z: targetTemplate.z || 0 }, styleGuide, [], undefined)
    return
  }
  for (const template of styleGuide.templates) {
    yield* iterateAllContent(target, template, template, { x: template.x, y: template.y, z: template.z || 0 }, styleGuide, [], undefined)
  }
}

function* iterateAllContent(
  target: TemplateContent | undefined,
  parent: Template,
  template: Template,
  position: Required<Position>,
  styleGuide: StyleGuide,
  rotates: Array<Required<Rotate> & Position>,
  props: unknown,
): Generator<ContentRegion, void, unknown> {
  for (let i = 0; i < parent.contents.length; i++) {
    const content = parent.contents[i]
    if (content === target || target === undefined) {
      const x = getPosition(props, 'x', content, parent, styleGuide)
      const y = getPosition(props, 'y', content, parent, styleGuide)
      const z = getPosition(props, 'z', content, parent, styleGuide)
      const targetProps = content.kind === 'reference' ? evaluate(content.props, { props }) : undefined
      const size = getContentSize(content, styleGuide)
      const width = targetProps ? evaluateSizeExpression('width', size, { props: targetProps }) : size.width
      const height = targetProps ? evaluateSizeExpression('height', size, { props: targetProps }) : size.height
      let rotate = evaluateRotateExpression(content, { props })
      let newX = position.x + x
      let newY = position.y + y
      if (rotates.length > 0) {
        rotate += rotates.reduce((p, c) => p + c.rotate, 0)
        let center: Position = {
          x: newX + width / 2,
          y: newY + height / 2
        }
        for (let i = rotates.length - 1; i >= 0; i--) {
          const r = rotates[i]
          center = rotatePositionByCenter(center, r, -r.rotate)
        }
        newX = center.x - width / 2
        newY = center.y - height / 2
      }
      yield {
        x: newX,
        y: newY,
        z: position.z + z,
        rotate: rotate || undefined,
        width,
        height,
        index: i,
        contents: parent.contents,
        content,
        parent,
        template,
        rotates,
      }
    }
    if (content.kind === 'snapshot') {
      const newRotates: Array<Required<Rotate> & Position> = [
        ...rotates,
        {
          rotate: content.rotate || 0,
          x: position.x + content.x + content.snapshot.width / 2,
          y: position.y + content.y + content.snapshot.height / 2,
        }
      ]
      yield* iterateAllContent(
        target,
        content.snapshot,
        template,
        {
          x: position.x + content.x,
          y: position.y + content.y,
          z: position.z + (content.z || 0),
        },
        styleGuide,
        newRotates,
        undefined
      )
    }
  }
}

function getTargetTemplateRegions(styleGuide: StyleGuide) {
  return sortByZ(Array.from(iterateAllTemplateRegions(undefined, styleGuide)))
}

function* iterateTemplateRegionByPosition(styleGuide: StyleGuide, position: Position) {
  for (const templateRegion of getTargetTemplateRegions(styleGuide)) {
    if (isInRegion(position, templateRegion)) {
      yield templateRegion
    }
  }
}

function* iterateAllTemplateRegions(
  target: Template | undefined,
  styleGuide: StyleGuide,
) {
  for (const template of styleGuide.templates) {
    yield* iterateAllTemplate(target, template, { x: template.x, y: template.y, z: template.z || 0 }, styleGuide, 0, undefined)
  }
}

function* iterateAllTemplate(
  target: Template | undefined,
  template: Template,
  position: Required<Position>,
  styleGuide: StyleGuide,
  rotate: number,
  props: unknown,
  parent?: { content: TemplateReferenceContent, template: Template, index: number },
): Generator<TemplateRegion, void, unknown> {
  if (template === target || target === undefined) {
    const width = evaluateSizeExpression('width', template, { props })
    const height = evaluateSizeExpression('height', template, { props })
    yield {
      x: position.x,
      y: position.y,
      z: position.z,
      width,
      height,
      parent,
      template,
      rotate,
    }
  }
  if (target && template !== target) {
    for (let i = 0; i < template.contents.length; i++) {
      const content = template.contents[i]
      if (content.kind === 'reference') {
        const reference = styleGuide.templates.find((t) => t.id === content.id)
        if (reference) {
          const x = getPosition(props, 'x', content, template, styleGuide)
          const y = getPosition(props, 'y', content, template, styleGuide)
          const z = getPosition(props, 'z', content, template, styleGuide)
          const targetProps = evaluate(content.props, { props })
          yield* iterateAllTemplate(
            target,
            reference,
            {
              x: x + position.x,
              y: y + position.y,
              z: z + position.z,
            },
            styleGuide,
            content.rotate || 0,
            targetProps,
            { content, template, index: i },
          )
        }
      }
    }
  }
}

type ContentOrTemplateRegion = {
  kind: "template";
  region: TemplateRegion;
} | {
  kind: "content";
  region: ContentRegion;
}

type TemplateRegion = Required<Region> & Rotate & {
  parent?: TemplateParent
  template: Template
}

interface TemplateParent {
  content: TemplateReferenceContent
  template: Template
  index: number
}

type ContentRegion = Required<Region> & Rotate & {
  index: number
  contents: TemplateContent[]
  content: TemplateContent
  parent: Template
  template: Template
  rotates: Array<Required<Rotate> & Position>
}

function isInRegion(position: Position | Position[], region: Region & Rotate): boolean {
  if (Array.isArray(position)) {
    return position.every((p) => isInRegion(p, region))
  }
  position = rotatePosition(position, region)
  return position.x >= region.x && position.y >= region.y && position.x <= region.x + region.width && position.y <= region.y + region.height
}

function rotatePosition(position: Position, region: Region & Rotate) {
  if (!region.rotate) {
    return position
  }
  const centerX = region.x + region.width / 2
  const centerY = region.y + region.height / 2
  return rotatePositionByCenter(position, { x: centerX, y: centerY }, region.rotate)
}

function rotatePositionByCenter(position: Position, center: Position, rotate: number) {
  if (!rotate) {
    return position
  }
  rotate = -rotate * Math.PI / 180
  const offsetX = position.x - center.x
  const offsetY = position.y - center.y
  const sin = Math.sin(rotate)
  const cos = Math.cos(rotate)
  return {
    x: cos * offsetX - sin * offsetY + center.x,
    y: sin * offsetX + cos * offsetY + center.y,
  }
}

function sortByZ<T extends { z: number }>(targets: T[]) {
  return targets.map((t, i) => ({ target: t, index: i })).sort((a, b) => {
    if (a.target.z !== b.target.z) {
      return b.target.z - a.target.z
    }
    return b.index - a.index
  }).map((t) => t.target)
}

function getPosition(props: unknown, type: 'x' | 'y' | 'z', content: TemplateContent, template: Template | undefined, styleGuide: StyleGuide) {
  if (type !== 'z' && template && template.display === 'flex') {
    return getFlexPosition(content, type, template, styleGuide)
  }
  return evaluatePositionExpression(type, content, { props })
}

function getFlexPosition(target: TemplateContent, kind: 'x' | 'y', template: Template, styleGuide: StyleGuide) {
  const flexDirection = template.flexDirection || 'row'
  const mainAxisPositionType = flexDirection === 'row' ? 'x' : 'y'
  if (kind === mainAxisPositionType) {
    const mainAxisSizeType = flexDirection === 'row' ? 'width' : 'height'
    return getMainAxisValue(
      template.justifyContent || 'start',
      template,
      mainAxisSizeType,
      template.contents.reduce((p, c) => p + getContentSize(c, styleGuide)[mainAxisSizeType], 0),
      template.contents.findIndex((c) => c === target),
      styleGuide
    )
  }
  return getCrossAxisValue(
    template.alignItems || 'start',
    template,
    flexDirection,
    getContentSize(target, styleGuide)
  )
}

function evaluatePositionExpression(kind: 'x' | 'y' | 'z', content: Position & PositionExpression, model: { [key: string]: unknown }, options?: ExpressionOptions) {
  const expressionField = (kind + 'Expression') as `${typeof kind}Expression`
  const expression = content[expressionField]
  if (expression) {
    const result = evaluate(expression, model, getExpressionOptions(options, expressionField))
    if (typeof result === 'number' && !isNaN(result)) {
      return kind === 'z' ? Math.round(result) : result
    }
  }
  return content[kind] || 0
}

function getCrossAxisValue(
  alignItems: 'start' | 'end' | 'center',
  template: Template,
  flexDirection: 'row' | 'column',
  contentSize: Size,
) {
  if (alignItems === 'start') {
    return 0
  }
  const crossAxisSizeType = flexDirection === 'row' ? 'height' : 'width'
  if (alignItems === 'end') {
    return template[crossAxisSizeType] - contentSize[crossAxisSizeType]
  }
  return (template[crossAxisSizeType] - contentSize[crossAxisSizeType]) / 2
}

function getContentSize(content: TemplateContent, styleGuide: StyleGuide): Size & SizeExpression {
  if (content.kind === 'reference') {
    const reference = styleGuide.templates.find((t) => t.id === content.id)
    if (reference) {
      return reference
    }
    return {
      width: 0,
      height: 0,
    }
  }
  if (content.kind === 'snapshot') {
    return content.snapshot
  }
  return content
}

function getExpressionOptions(options: ExpressionOptions | undefined, item: string | number) {
  if (options && options.stack) {
    return { ...options, stack: [...options.stack, item] }
  }
  return options
}

interface ExpressionOptions {
  errorHandler?: (reason: ExpressionErrorReason) => void
  precompiledStyleGuide?: PrecompiledStyleGuide
  stack?: (string | number)[]
}

interface ExpressionErrorReason {
  error: unknown
  expression: string
  model: { [key: string]: unknown }
  stack?: (string | number)[]
}

class PrecompiledStyleGuide {
  ast: { [expression: string]: Expression | Error } = {}
  repeat: { [repeat: string]: Repeat } = {}
  constructor(styleGuide: StyleGuide) {
    for (const template of styleGuide.templates) {
      this.collectExpression(template.widthExpression)
      this.collectExpression(template.heightExpression)

      for (const content of template.contents) {
        if (content.kind === 'snapshot') {
          continue
        }
        if (content.repeat) {
          const repeat = this.collectRepeat(content.repeat)
          this.collectExpression(repeat.expression)
        }
        this.collectExpression(content.if)
        this.collectExpression(content.xExpression)
        this.collectExpression(content.yExpression)
        this.collectExpression(content.zExpression)
        if (content.kind === 'reference') {
          this.collectExpression(content.props)
          continue
        }
        this.collectExpression(content.widthExpression)
        this.collectExpression(content.heightExpression)
        this.collectExpression(content.rotateExpression)
        if (content.kind === 'text') {
          this.collectExpression(content.textExpression)
          this.collectExpression(content.fontSizeExpression)
          this.collectExpression(content.colorExpression)
        } else if (content.kind === 'image') {
          this.collectExpression(content.urlExpression)
        } else if (content.kind === 'color') {
          this.collectExpression(content.colorExpression)
        }
      }
    }
  }
  private collectExpression(expression: string | undefined) {
    if (expression && !this.ast[expression]) {
      this.ast[expression] = parseExpressionToAst(expression)
    }
  }
  private collectRepeat(repeat: string) {
    if (!this.repeat[repeat]) {
      this.repeat[repeat] = analyseRepeat(repeat)
    }
    return this.repeat[repeat]
  }
}

function parseExpressionToAst(expression: string) {
  try {
    return parseExpression(tokenizeExpression(expression))
  } catch (error: unknown) {
    return error instanceof Error ? error : new Error(String(error))
  }
}

function analyseRepeat(repeat: string, options?: ExpressionOptions): Repeat {
  if (options && options.precompiledStyleGuide) {
    return options.precompiledStyleGuide.repeat[repeat]
  }
  const index = repeat.indexOf(' in ')
  if (index === -1) {
    return { expression: repeat }
  }
  const declaration = repeat.substring(0, index).trim()
  const expression = repeat.substring(index + 4).trim()
  if (declaration.startsWith('(') && declaration.endsWith(')')) {
    const declarations = declaration.substring(1, declaration.length - 1).split(',')
    if (declarations.length === 0) {
      return { expression }
    }
    if (declarations.length === 1) {
      return { expression, itemName: declarations[0].trim() }
    }
    return { expression, itemName: declarations[0].trim(), indexName: declarations[1].trim() }
  }
  return { expression, itemName: declaration }
}

interface Repeat {
  expression: string
  itemName?: string
  indexName?: string
}

function evaluate(expression: string | undefined, model: { [key: string]: unknown }, options?: ExpressionOptions) {
  if (!expression) {
    return undefined
  }
  try {
    if (options && options.precompiledStyleGuide) {
      const ast = options.precompiledStyleGuide.ast[expression]
      if (ast instanceof Error) {
        throw ast
      }
      return evaluateExpression(ast, model)
    }
    return evaluateExpression(parseExpression(tokenizeExpression(expression)), model)
  } catch (error: unknown) {
    if (options && options.errorHandler) {
      options.errorHandler({ error, expression, model, stack: options.stack })
    }
    return undefined
  }
}

function getMainAxisValue(
  justifyContent: 'start' | 'end' | 'center' | 'between',
  template: Template,
  mainAxisSizeType: 'width' | 'height',
  totalContentSize: number,
  i: number,
  styleGuide: StyleGuide,
) {
  let mainAxisValue: number
  if (justifyContent === 'start') {
    mainAxisValue = 0
  } else if (justifyContent === 'end') {
    mainAxisValue = template[mainAxisSizeType] - totalContentSize
  } else if (justifyContent === 'center') {
    mainAxisValue = (template[mainAxisSizeType] - totalContentSize) / 2
  } else {
    if (template.contents.length > 1) {
      mainAxisValue = i * Math.max(0, (template[mainAxisSizeType] - totalContentSize) / (template.contents.length - 1))
    } else {
      mainAxisValue = 0
    }
  }
  for (let j = 0; j < i; j++) {
    mainAxisValue += getContentSize(template.contents[j], styleGuide)[mainAxisSizeType]
  }
  return mainAxisValue
}

function evaluateSizeExpression(kind: 'width' | 'height', content: Size & SizeExpression, model: { [key: string]: unknown }, options?: ExpressionOptions) {
  const expressionField = (kind + 'Expression') as `${typeof kind}Expression`
  const expression = content[expressionField]
  if (expression) {
    const result = evaluate(expression, model, getExpressionOptions(options, expressionField))
    if (typeof result === 'number' && !isNaN(result)) {
      return result
    }
  }
  return content[kind]
}

function evaluateRotateExpression(content: Rotate & RotateExpression, model: { [key: string]: unknown }, options?: ExpressionOptions) {
  const expression = content.rotateExpression
  if (expression) {
    const result = evaluate(expression, model, getExpressionOptions(options, 'rotateExpression'))
    if (typeof result === 'number' && !isNaN(result)) {
      return result
    }
  }
  return content.rotate || 0
}

export function selectTemplateByArea(styleGuide: StyleGuide, position1: Position, position2: Position) {
  const region: Region = {
    x: Math.min(position1.x, position2.x),
    y: Math.min(position1.y, position2.y),
    width: Math.abs(position1.x - position2.x),
    height: Math.abs(position1.y - position2.y),
  }
  let potentialTemplateRegion: Required<Region> & { parent?: { content: TemplateReferenceContent, template: Template, index: number }, template: Template } | undefined
  for (const templateRegion of getTargetTemplateRegions(styleGuide)) {
    const positions: Position[] = [
      {
        x: templateRegion.x,
        y: templateRegion.y,
      },
      {
        x: templateRegion.x + templateRegion.width,
        y: templateRegion.y + templateRegion.height,
      },
    ]
    if ((!potentialTemplateRegion || templateRegion.z >= potentialTemplateRegion.z) && isInRegion(positions, region)) {
      potentialTemplateRegion = templateRegion
    }
  }
  if (potentialTemplateRegion) {
    return potentialTemplateRegion.template
  }
  return null
}
