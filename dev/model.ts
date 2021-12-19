export interface StyleGuide {
  name: string
  templates: Template[]
  variables?: StyleGuideVariable[][]
  collections?: StyleGuideCollection[]
  constrains?: string[]
  tests?: GenerationTest[]
}

interface GenerationTest {
  templateId: string
  case: unknown
  result?: Template[]
}

type StyleGuideCollection = StyleGuideColor

interface StyleGuideColor {
  kind: 'color'
  color: string
}

interface StyleGuideVariable {
  kind?: string
  name: string
  displayName?: string
  value: unknown
}

export interface Template extends Region, SizeExpression, FlexField {
  id: string
  name?: string
  contents: TemplateContent[]
  parameters?: string[]
}

export type TemplateContent = TemplateTextContent | TemplateImageContent | TemplateColorContent | TemplateReferenceContent | TemplateSnapshotContent

export interface TemplateTextContent extends Region, RegionExpression, GenerationField, Hidden, Rotate, RotateExpression {
  kind: 'text'

  text: string
  textExpression?: string
  textExpressionId?: string

  fontFamily: string

  fontSize: number
  fontSizeExpression?: string
  fontSizeExpressionId?: string

  color: string
  colorExpression?: string
  colorExpressionId?: string

  characters?: TextCharacter[]
}

interface TextCharacter {
  text: string
}

interface Hidden {
  hidden?: boolean
}

export interface TemplateImageContent extends Region, RegionExpression, GenerationField, Hidden, Rotate, RotateExpression {
  kind: 'image'

  url: string
  urlExpression?: string
  urlExpressionId?: string

  opacity?: number
  base64?: string
  blendMode?: 'multiply'
}

export interface TemplateColorContent extends Region, RegionExpression, GenerationField, Hidden, Rotate, RotateExpression {
  kind: 'color'

  color: string
  colorExpression?: string
  colorExpressionId?: string
}

export interface TemplateReferenceContent extends Position, PositionExpression, GenerationField, Hidden, Rotate {
  kind: 'reference'
  id: string
  props?: string
  propsIds?: { [key: string]: string }
}

export interface TemplateSnapshotContent extends Position, PositionExpression, Hidden, Rotate {
  kind: 'snapshot'
  snapshot: Template
}

export interface Position {
  x: number
  y: number
  z?: integer
}

interface PositionExpression {
  xExpression?: string
  yExpression?: string
  zExpression?: string
  xExpressionId?: string
  yExpressionId?: string
  zExpressionId?: string
}

export interface Size {
  width: number
  height: number
}

interface SizeExpression {
  widthExpression?: string
  heightExpression?: string
  widthExpressionId?: string
  heightExpressionId?: string
}

interface Rotate {
  /**
   * @default 0
   */
  rotate?: number
}

interface RotateExpression {
  rotateExpression?: string
  rotateExpressionId?: string
}

export interface Region extends Position, Size { }

interface RegionExpression extends PositionExpression, SizeExpression { }

interface GenerationField {
  if?: string
  ifId?: string
  /**
   * @default false
   */
  else?: boolean
  repeat?: string
  repeatId?: string
}

interface FlexField extends MarginField {
  display?: 'flex'
  flexDirection?: 'row' | 'column'
  justifyContent?: 'start' | 'end' | 'center' | 'between'
  alignItems?: 'start' | 'end' | 'center'
}

interface MarginField {
  marginLeft?: number
  marginRight?: number
  marginTop?: number
  marginBottom?: number
}

type integer = number

export type CanvasSelection =
  | {
    kind: 'template'
    templateIndex: number
  }
  | {
    kind: 'content'
    templateIndex: number
    contentIndex: number
  }
