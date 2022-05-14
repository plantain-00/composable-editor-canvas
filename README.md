# composable-editor-canvas

A composable editor canvas library.

[![Dependency Status](https://david-dm.org/plantain-00/composable-editor-canvas.svg)](https://david-dm.org/plantain-00/composable-editor-canvas)
[![devDependency Status](https://david-dm.org/plantain-00/composable-editor-canvas/dev-status.svg)](https://david-dm.org/plantain-00/composable-editor-canvas#info=devDependencies)
[![Build Status: Windows](https://ci.appveyor.com/api/projects/status/github/plantain-00/composable-editor-canvas?branch=master&svg=true)](https://ci.appveyor.com/project/plantain-00/composable-editor-canvas/branch/master)
![Github CI](https://github.com/plantain-00/composable-editor-canvas/workflows/Github%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/composable-editor-canvas.svg)](https://badge.fury.io/js/composable-editor-canvas)
[![Downloads](https://img.shields.io/npm/dm/composable-editor-canvas.svg)](https://www.npmjs.com/package/composable-editor-canvas)
[![gzip size](https://img.badgesize.io/https://unpkg.com/composable-editor-canvas?compression=gzip)](https://unpkg.com/composable-editor-canvas)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fplantain-00%2Fcomposable-editor-canvas%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/composable-editor-canvas)

## install

`yarn add composable-editor-canvas`

## usage

### undo/redo

```ts
import { useUndoRedo, useKey } from "composable-editor-canvas"

const { state, setState, undo, redo } = useUndoRedo(initialState)
useKey((k) => k.code === 'KeyZ' && !k.shiftKey && k.metaKey, undo)
useKey((k) => k.code === 'KeyZ' && k.shiftKey && k.metaKey, redo)
```

<https://plantain-00.github.io/composable-editor-canvas/?p=undo-redo.story>

### wheel scroll canvas

```ts
import { useWheelScroll } from "composable-editor-canvas"

const [x, setX] = React.useState(0)
const [y, setY] = React.useState(0)
const initialScale = Math.min((containerSize.width - padding) / targetSize.width, (containerSize.height - padding) / targetSize.height)
const scale = relativeScale * initialScale
const contentSize = {
  width: targetSize.width * scale + padding,
  height: targetSize.height * scale + padding,
}
const wheelScrollRef = useWheelScroll<HTMLElement>(
  setX,
  setY,
  (contentSize.width - containerSize.width) / 2,
  (contentSize.height - containerSize.height) / 2,
)
```

<https://plantain-00.github.io/composable-editor-canvas/?p=wheel-scroll.story>

### wheel zoom canvas

```ts
import { useWheelZoom } from "composable-editor-canvas"

const [relativeScale, setRelativeScale] = React.useState(1)
const wheelZoomRef = useWheelZoom<HTMLElement>(setRelativeScale)
```

<https://plantain-00.github.io/composable-editor-canvas/?p=wheel-zoom.story>

### keyboard zoom canvas

```ts
import { useZoom, useKey } from "composable-editor-canvas"

const [relativeScale, setRelativeScale] = React.useState(1)
const { zoomIn, zoomOut } = useZoom(relativeScale, setRelativeScale)
useKey((k) => k.code === 'Minus' && k.metaKey, zoomOut)
useKey((k) => k.code === 'Equal' && k.metaKey, zoomIn)
```

<https://plantain-00.github.io/composable-editor-canvas/?p=keyboard-zoom.story>

### scrollbar scroll canvas

```tsx
import { Scrollbar } from "composable-editor-canvas"

<Scrollbar
  value={x}
  type='horizontal'
  containerSize={containerSize.width}
  contentSize={contentSize.width}
  onChange={setX}
/>
<Scrollbar
  value={y}
  type='vertical'
  containerSize={containerSize.height}
  contentSize={contentSize.height}
  onChange={setY}
/>
```

<https://plantain-00.github.io/composable-editor-canvas/?p=scrollbar.story>

### drag selected move

```ts
import { useDragMove } from "composable-editor-canvas"

const [moveOffset, setMoveOffset] = React.useState({ x: 0, y: 0 })
const { onStartMove, dragMoveMask } = useDragMove(
  setMoveOffset,
  () => {
    setState((draft) => {
      if (target) {
        target.x += moveOffset.x
        target.y += moveOffset.y
      }
    })
  },
  {
    scale,
  },
)
```

<https://plantain-00.github.io/composable-editor-canvas/?p=drag-move.story>

### drag selected rotate

```tsx
import { useDragRotate, RotationBar } from "composable-editor-canvas"

const [rotate, setRotate] = React.useState<number>()
const { onStartRotate, dragRotateMask } = useDragRotate(
  setRotate,
  () => {
    setState((draft) => {
      if (target) {
        target.rotate = rotate
      }
    })
  },
  {
    transform: {
      containerSize,
      targetSize,
      x,
      y,
      scale,
    },
  },
)

<RotationBar
  scale={scale}
  onMouseDown={() => {
    onStartRotate({
      x: template.x + content.x + width / 2,
      y: template.y + content.y + height / 2,
    })
  }}
/>
```

<https://plantain-00.github.io/composable-editor-canvas/?p=drag-rotate.story>

### drag selected resize

```tsx
import { useDragResize, ResizeBar } from "composable-editor-canvas"

const [resizeOffset, setResizeOffset] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
const { onStartResize, dragResizeMask } = useDragResize(
  setResizeOffset,
  () => {
    setState((draft) => {
      if (target) {
        target.width += resizeOffset.width
        target.height += resizeOffset.height
        target.x += resizeOffset.x
        target.y += resizeOffset.y
      }
    })
  },
  {
    centeredScaling: (e) => e.shiftKey,
    keepRatio: (e) => e.metaKey ? 1 : undefined,
    rotate: 0,
  },
)

<ResizeBar
  scale={scale}
  onMouseDown={onStartResize}
/>
```

<https://plantain-00.github.io/composable-editor-canvas/?p=drag-resize.story>

### drag select

```tsx
import { useDragSelect } from "composable-editor-canvas"

const { onStartSelect, dragSelectMask } = useDragSelect<number[] | undefined>((dragSelectStartPosition, dragSelectEndPosition) => {
  if (!dragSelectEndPosition) {
    setSelected(dragSelectStartPosition.data)
  } else {
    const template = selectTemplateByArea(state, transformPosition(dragSelectStartPosition, transform), transformPosition(dragSelectEndPosition, transform))
    if (template) {
      setSelected([state.templates.findIndex((t) => t === template)])
    }
  }
}, (e) => e.shiftKey)
```

<https://plantain-00.github.io/composable-editor-canvas/?p=drag-select.story>

### region alignment line

```tsx
import { useRegionAlignment } from "composable-editor-canvas"

const { regionAlignmentX, regionAlignmentY, changeOffsetByRegionAlignment, clearRegionAlignments } = useRegionAlignment(6 / scale)

(f, e) => {
  if (!e.shiftKey) {
    changeOffsetByRegionAlignment(f, target, regions)
  } else {
    clearRegionAlignments()
  }
  setMoveOffset(f)
}

<AlignmentLine type='x' value={regionAlignmentX} transformX={transformX} />
<AlignmentLine type='y' value={regionAlignmentY} transformY={transformY} />
```

<https://plantain-00.github.io/composable-editor-canvas/?p=region-alignment-line.story>

### line alignment line

```tsx
import { useLineAlignment } from "composable-editor-canvas"

const { lineAlignmentX, lineAlignmentY, changeOffsetByLineAlignment, clearLineAlignments } = useLineAlignment(6 / scale)

(f, e, direction) => {
  if (!e.shiftKey) {
    changeOffsetByLineAlignment(f, direction, template, xLines, yLines)
  } else {
    clearRegionAlignments()
  }
  setResizeOffset(f)
}

<AlignmentLine type='x' value={lineAlignmentX} transformX={transformX} />
<AlignmentLine type='y' value={lineAlignmentY} transformY={transformY} />
```

<https://plantain-00.github.io/composable-editor-canvas/?p=line-alignment-line.story>

### circle click create

```ts
import { useCircleClickCreate } from "composable-editor-canvas"

const [circle, setCircle] = React.useState<Circle>()
const [contents, setContents] = React.useState<Circle[]>([])
const { onCircleClickCreateClick, onCircleClickCreateMove } = useCircleClickCreate('2 points', setCircle, (c) => {
  setContents(produce(contents, (draft) => {
    draft.push(c)
  }))
})
```

<https://plantain-00.github.io/composable-editor-canvas/?p=circle-click-2-points-create.story>
<https://plantain-00.github.io/composable-editor-canvas/?p=circle-click-3-points-create.story>
<https://plantain-00.github.io/composable-editor-canvas/?p=circle-click-center-radius-create.story>

### line click create

```ts
import { useLineClickCreate } from "composable-editor-canvas"

const [line, setLine] = React.useState<Position[]>()
const [contents, setContents] = React.useState<Position[][]>([])
const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate('2 points', setLine, (n) => 
  setContents(produce(contents, (draft) => {
    draft.push(n)
  }))
})
```

<https://plantain-00.github.io/composable-editor-canvas/?p=line-click-create-pixi.story>

### circle edit

```tsx
import { useCircleEdit } from "composable-editor-canvas"

const [circleEditOffset, setCircleEditOffset] = React.useState<Circle>({ x: 0, y: 0, r: 0 })
const circle = produce(content, (draft) => {
  draft.x += circleEditOffset.x
  draft.y += circleEditOffset.y
  draft.r += circleEditOffset.r
})
const { onStartEditCircle, circleEditMask } = useCircleEdit(setCircleEditOffset, () => setContent(circle))

<CircleEditBar
  x={circle.x}
  y={circle.y}
  radius={circle.r}
  onMouseDown={(e, type, cursor) => onStartEditCircle(e, { ...content, type, cursor })}
/>
```

<https://plantain-00.github.io/composable-editor-canvas/?p=circle-edit.story>

### polyline edit

```tsx
import { usePolylineEdit } from "composable-editor-canvas"

const [polyineEditOffset, setPolylineEditOffset] = React.useState<Position & { pointIndexes: number[] }>()
const points = produce(content, (draft) => {
  if (polyineEditOffset) {
    for (const pointIndex of polyineEditOffset.pointIndexes) {
      draft[pointIndex].x += polyineEditOffset.x
      draft[pointIndex].y += polyineEditOffset.y
    }
  }
})
const { onStartEditPolyline, polylineEditMask } = usePolylineEdit(setPolylineEditOffset, () => setContent(points))

<PolylineEditBar
  points={points}
  onMouseDown={(e, pointIndexes) => onStartEditPolyline(e, pointIndexes)}
/>
```

<https://plantain-00.github.io/composable-editor-canvas/?p=polyline-edit.story>
