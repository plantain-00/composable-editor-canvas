import { createRoot } from 'react-dom/client'
import React from "react"
import './vender/prism'
import './vender/prism.css'

import { navigateTo, useLocation } from '@protocol-based-web-framework/router/dist/use-location'
import { stories } from './import-stories'
import { App } from './content-editor'
import { useDragMove } from '../src'
import { WhiteBoard } from './whiteboard'
import { Combination2 } from './combination-2'
import { Combination3 } from './combination-3'
import { Combination4 } from './combination-4'
import { Combination5 } from './combination-5'
import { Combination6 } from './combination-6'

const combinations = [
  { path: 'whiteboard', name: 'whiteboard', component: WhiteBoard },
  { path: 'index', name: 'combination 1', component: App },
  { path: 'combination2', name: 'combination 2', component: Combination2 },
  { path: 'combination3', name: 'combination 3', component: Combination3 },
  { path: 'combination4', name: 'combination 4', component: Combination4 },
  { path: 'combination5', name: 'combination 5', component: Combination5 },
  { path: 'combination6', name: 'combination 6', component: Combination6 },
]

function StoryApp() {
  const [, search] = useLocation(React)
  const [x, setX] = React.useState(0)
  const { onStart, offset, mask } = useDragMove(() => {
    setX((v) => v + offset.x)
  })
  if (!search) {
    return (
      <ul style={{ margin: '20px 50px' }}>
        {combinations.map((s) => <li style={{ cursor: 'pointer' }} key={s.path} onClick={() => navigateTo(location.pathname + '?p=' + s.path)}>{s.name}</li>)}
        {stories.map((s) => <li style={{ cursor: 'pointer' }} key={s.path} onClick={() => navigateTo(location.pathname + '?p=' + s.path)}>{s.name} {s.path}</li>)}
      </ul>
    )
  }
  const path = search.substring('?p='.length)
  const combination = combinations.find(p => p.path === path)
  if (combination) {
    return (
      <combination.component />
    )
  }
  for (const story of stories) {
    if (path === story.path) {
      return (
        <div style={{ display: 'flex', padding: '20px', height: `calc(${window.innerHeight}px - 40px)`, overflowY: 'auto' }}>
          <div style={{ width: `calc(50% + ${x + offset.x}px)` }}>
            <OffsetXContext.Provider value={{ offset: x, setOffset: setX }}>
              <story.Component />
            </OffsetXContext.Provider>
          </div>
          <div style={{ width: '5px', cursor: 'ew-resize', zIndex: 1 }} onMouseDown={(e) => onStart({ x: e.clientX, y: e.clientY })}></div>
          <div style={{ width: `calc(50% - 5px - ${x + offset.x}px)` }}>
            <HighlightCode code={story.code} />
          </div>
          {mask}
        </div>
      )
    }
  }
  return null
}

export const OffsetXContext = React.createContext<{ offset: number, setOffset?: (offset: number) => void }>({ offset: 0 })

function HighlightCode(props: { code: string }) {
  const ref = React.useRef<HTMLElement | null>(null)
  React.useEffect(() => {
    if (ref.current) {
      Prism.highlightElement(ref.current)
    }
  }, [props.code, ref.current])
  return (
    <pre className="line-numbers">
      <code ref={ref} className="language-tsx">
        {props.code}
      </code>
    </pre>
  )
}

const container = document.querySelector('#container')
if (container) {
  createRoot(container).render(<StoryApp />)
}

declare global {
  const Prism: {
    highlightElement(element: HTMLOrSVGElement): void
  }
} 
