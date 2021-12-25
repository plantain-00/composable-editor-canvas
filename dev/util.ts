import { Position, Region, Rotate, StyleGuide, Template, TemplateContent, TemplateReferenceContent, TemplateSnapshotContent } from "./model"

export function getSelectedSize(selected: number[] | undefined, styleGuide: StyleGuide) {
  const target = getTargetByPath(selected, styleGuide)
  if (!target) {
    return undefined
  }
  const template = target.template
  if (target.kind === 'content') {
    return getTemplateContentSize(target.content, styleGuide)
  }
  return template
}

export function getSelectedPosition(selected: number[] | undefined, styleGuide: StyleGuide) {
  const target = getTargetByPath(selected, styleGuide)
  if (!target) {
    return undefined
  }
  return target.kind === 'template' ? target.template : target.content
}

export function getTargetByPath(path: number[] | undefined, styleGuide: StyleGuide) {
  if (!path) {
    return undefined
  }
  const [index, ...indexes] = path
  const template = styleGuide.templates[index]
  if (indexes.length === 0) {
    return {
      kind: 'template' as const,
      template,
    }
  }
  const content = getTargetContentByPath(indexes, template, styleGuide, [])
  if (content) {
    return {
      kind: 'content' as const,
      template,
      content: content.content,
      parents: content.parents,
    }
  }
  return undefined
}

function getTargetContentByPath(
  [index, ...indexes]: number[],
  template: Template,
  styleGuide: StyleGuide,
  parents: (TemplateSnapshotContent | TemplateReferenceContent)[],
): {
  content: TemplateContent
  parents: (TemplateSnapshotContent | TemplateReferenceContent)[]
} | undefined {
  const content = template.contents[index]
  if (indexes.length === 0) {
    return {
      content,
      parents,
    }
  }
  if (content.kind === 'snapshot') {
    return getTargetContentByPath(indexes, content.snapshot, styleGuide, [...parents, content])
  }
  if (content.kind === 'reference') {
    const reference = styleGuide.templates.find((t) => t.id === content.id)
    if (!reference) {
      return undefined
    }
    return getTargetContentByPath(indexes, reference, styleGuide, [...parents, content])
  }
  return undefined
}

export function getTemplateContentSize(content: TemplateContent, styleGuide: StyleGuide) {
  if (content.kind === 'snapshot') {
    return content.snapshot
  }
  if (content.kind === 'reference') {
    const reference = styleGuide.templates.find((t) => t.id === content.id)
    if (!reference) {
      return undefined
    }
    return reference
  }
  return content
}

export function isSamePath(path1: number[] | undefined, path2: number[] | undefined) {
  if (path1 && path2) {
    if (path1.length !== path2.length) {
      return false
    }
    for (let i = 0; i < path1.length; i++) {
      if (path1[i] !== path2[i]) {
        return false
      }
    }
    return true
  }
  return path1 === undefined && path2 === undefined
}

export function selectTemplateByArea(styleGuide: StyleGuide, position1: Position, position2: Position) {
  const region = {
    x: Math.min(position1.x, position2.x),
    y: Math.min(position1.y, position2.y),
    width: Math.abs(position1.x - position2.x),
    height: Math.abs(position1.y - position2.y),
  }
  for (let i = 0; i < styleGuide.templates.length; i++) {
    const template = styleGuide.templates[i]
    const positions: Position[] = [
      {
        x: template.x,
        y: template.y,
      },
      {
        x: template.x + template.width,
        y: template.y + template.height,
      },
    ]
    if (isInRegion(positions, region)) {
      return i
    }
  }
  return undefined
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

export function rotatePositionByCenter(position: Position, center: Position, rotate: number) {
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

export const nameSize = 14

export function selectByPosition(styleGuide: StyleGuide, position: Position, scale: number) {
  const realNameSize = nameSize / scale
  for (let i = styleGuide.templates.length - 1; i >= 0; i--) {
    const template = styleGuide.templates[i]
    if (template.name && isInRegion(position, {
      x: template.x,
      y: template.y - realNameSize,
      width: realNameSize * template.name.length,
      height: realNameSize,
    })) {
      return [i]
    }
    for (const content of iterateAllContent(template, template, styleGuide, [], [])) {
      if (isInRegion(position, content)) {
        return [i, ...content.path]
      }
    }
    if (isInRegion(position, template)) {
      return [i]
    }
  }
  return undefined
}

type ContentRegion = Region & Rotate & {
  path: number[]
  content: TemplateContent
  parent: Template
  rotates: Array<Required<Rotate> & Position>
}

function* iterateAllContent(
  parent: Template,
  position: Position,
  styleGuide: StyleGuide,
  rotates: Array<Required<Rotate> & Position>,
  path: number[],
): Generator<ContentRegion, void, unknown> {
  for (let i = parent.contents.length - 1; i >= 0; i--) {
    const content = parent.contents[i]
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
        content.snapshot,
        {
          x: position.x + content.x,
          y: position.y + content.y,
        },
        styleGuide,
        newRotates,
        [...path, i],
      )
    }
    const x = content.x
    const y = content.y
    const size = getTemplateContentSize(content, styleGuide)
    const width = size?.width ?? 0
    const height = size?.height ?? 0
    let rotate = content.rotate || 0
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
      rotate,
      width,
      height,
      path: [...path, i],
      content,
      parent,
      rotates,
    }
  }
}
