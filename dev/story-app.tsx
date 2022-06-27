import { createRoot } from 'react-dom/client'
import React from "react"
import './vender/prism'
import './vender/prism.css'

import { navigateTo, useLocation } from '@protocol-based-web-framework/router'
import { stories } from './import-stories'
import { App } from '.'
import { useDragMove } from '../src'

function StoryApp() {
  const [, search] = useLocation(React)
  const [x, setX] = React.useState(0)
  const { onStart, offset, mask } = useDragMove(() => {
    setX((v) => v + offset.x)
  })
  if (!search) {
    return (
      <ul style={{ margin: '20px 50px' }}>
        {stories.map((s) => <li style={{ cursor: 'pointer' }} key={s.path} onClick={() => navigateTo(location.pathname + '?p=' + s.path)}>{s.name} {s.path}</li>)}
        <li style={{ cursor: 'pointer' }} onClick={() => navigateTo(location.pathname + '?p=index')}>combination 1</li>
      </ul>
    )
  }
  const path = search.substring('?p='.length)
  if (path === 'index') {
    return (
      <App />
    )
  }
  for (const story of stories) {
    if (path === story.path) {
      return (
        <div style={{ display: 'flex', padding: '20px', height: `calc(${window.innerHeight}px - 40px)`, overflowY: 'auto' }}>
          <div style={{ width: `calc(50% + ${x + offset.x}px)` }}>
            <OffsetXContext.Provider value={x}>
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

export const OffsetXContext = React.createContext<number>(0)

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
