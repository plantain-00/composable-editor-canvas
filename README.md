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
const [offset, setOffset] = React.useState({ x: 0, y: 0 })
const [selected, setSelected] = React.useState<CanvasSelection>()
const { onMouseDown, dragMask } = useDragMove(setOffset, scale, () => {
  setState((draft) => {
    if (selected) {
      const template = draft.templates[selected.templateIndex]
      if (selected.kind === 'content') {
        template.contents[selected.contentIndex].x += offset.x
        template.contents[selected.contentIndex].y += offset.y
      } else {
        template.x += offset.x
        template.y += offset.y
      }
    }
  })
  setOffset({ x: 0, y: 0 })
})
```
