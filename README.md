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
import { useUndoRedo } from "composable-editor-canvas"
import { useKey } from 'react-use'

const { state, setState, undo, redo } = useUndoRedo(initialState)
useKey((k) => k.code === 'KeyZ' && k.metaKey, undo)
useKey((k) => k.code === 'KeyZ' && k.shiftKey && k.metaKey, redo)
```

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
const wheelScrollRef = useWheelScroll<HTMLDivElement>(
  setX,
  setY,
  (contentSize.width - containerSize.width) / 2,
  (contentSize.height - containerSize.height) / 2,
)
```

### wheel zoom canvas

```ts
import { useWheelZoom } from "composable-editor-canvas"

const [relativeScale, setRelativeScale] = React.useState(1)
const wheelZoomRef = useWheelZoom<HTMLDivElement>(setRelativeScale)
```

### keyboard zoom canvas

```ts
import { useZoom } from "composable-editor-canvas"
import { useKey } from 'react-use'

const [relativeScale, setRelativeScale] = React.useState(1)
const { zoomIn, zoomOut } = useZoom(relativeScale, setRelativeScale)
useKey((k) => k.code === 'Minus' && k.metaKey, zoomOut)
useKey((k) => k.code === 'Equal' && k.metaKey, zoomIn)
```

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

### drag selected move

```ts
import { useDragMove } from "composable-editor-canvas"

const [moveOffset, setMoveOffset] = React.useState({ x: 0, y: 0 })
const [selected, setSelected] = React.useState<CanvasSelection>()
const { onStartMove, dragMoveMask } = useDragMove(setMoveOffset, scale, () => {
  setState((draft) => {
    if (selected) {
      target.x += moveOffset.x
      target.y += moveOffset.y
    }
  })
  setMoveOffset({ x: 0, y: 0 })
})
```

### drag selected rotate

```tsx
import { useDragRotate, RotationBar } from "composable-editor-canvas"

const [rotate, setRotate] = React.useState<number>()
const { onStartRotate, dragRotateMask } = useDragRotate(
  setRotate,
  () => {
    setState((draft) => {
      if (selected) {
        target.rotate = rotate
      }
    })
    setRotate(undefined)
  },
  {
    containerSize,
    targetSize,
    x,
    y,
    scale,
  }
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

### drag selected resize

```tsx
import { useDragResize, ResizeBar } from "composable-editor-canvas"

const [resizeOffset, setResizeOffset] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
const { onStartResize, dragResizeMask } = useDragResize(
  setResizeOffset,
  () => {
    setState((draft) => {
      if (selected) {
        target.width += resizeOffset.width
        target.height += resizeOffset.height
        target.x += resizeOffset.x
        target.y += resizeOffset.y
      }
    })
    setResizeOffset({ x: 0, y: 0, width: 0, height: 0 })
  },
  {
    centeredScaling: (e) => e.shiftKey,
    keepRatio: (e) => e.metaKey ? 1 : undefined,
    rotate: 0,
    transform: {
      containerSize,
      targetSize,
      x,
      y,
      scale,
    },
  },
)

<ResizeBar
  scale={scale}
  onMouseDown={onStartResize}
/>
```

### drag select

```tsx
import { useDragSelect } from "composable-editor-canvas"

const { onStartSelect, dragSelectMask } = useDragSelect<CanvasSelection | undefined>((dragSelectStartPosition, dragSelectEndPosition) => {
  if (!dragSelectEndPosition) {
    setSelected(dragSelectStartPosition.data)
  } else {
    const template = selectTemplateByArea(state, transformPosition(dragSelectStartPosition, transform), transformPosition(dragSelectEndPosition, transform))
    if (template) {
      setSelected({ kind: 'template', templateIndex: state.templates.findIndex((t) => t === template) })
    }
  }
}, (e) => e.shiftKey)
```
