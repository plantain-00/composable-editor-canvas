import { createRoot } from 'react-dom/client'
import React from "react"
import './vender/prism'
import './vender/prism.css'

import { navigateTo, useLocation } from '@protocol-based-web-framework/router'
import { stories } from './import-stories'
import { App } from '.'

function StoryApp() {
  const [, search] = useLocation(React)
  if (!search) {
    return (
      <ul style={{ margin: '20px 50px' }}>
        <li style={{ cursor: 'pointer' }} onClick={() => navigateTo(location.pathname + '?p=index')}>combination 1</li>
        {stories.map((s) => <li style={{ cursor: 'pointer' }} key={s.path} onClick={() => navigateTo(location.pathname + '?p=' + s.path)}>{s.name} {s.path}</li>)}
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
          <div style={{ width: '50%' }}>
            <story.Component />
          </div>
          <div style={{ width: '50%' }}>
            <HighlightCode code={story.code} />
          </div>
        </div>
      )
    }
  }
  return null
}

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

createRoot(document.querySelector('#container')!).render(<StoryApp />)

declare global {
  const Prism: {
    highlightElement(element: HTMLElement): void
  }
} 
