import { Position, Region } from "../../src"

export interface StyleGuide {
  name: string
  templates: Template[]
}

export interface Template extends Region {
  id: string
  name?: string
  contents: TemplateContent[]
}

export type TemplateContent = TemplateTextContent | TemplateImageContent | TemplateColorContent | TemplateReferenceContent | TemplateSnapshotContent

export interface TemplateTextContent extends Region, Hidden, Rotate {
  kind: 'text'
  text: string
  fontFamily: string
  fontSize: number
  color: string
}

interface Hidden {
  hidden?: boolean
}

export interface TemplateImageContent extends Region, Hidden, Rotate {
  kind: 'image'
  url: string
}

export interface TemplateColorContent extends Region, Hidden, Rotate {
  kind: 'color'
  color: string
}

export interface TemplateReferenceContent extends Position, Hidden, Rotate {
  kind: 'reference'
  id: string
}

export interface TemplateSnapshotContent extends Position, Hidden, Rotate {
  kind: 'snapshot'
  snapshot: Template
}

export interface Rotate {
  rotate?: number
}
