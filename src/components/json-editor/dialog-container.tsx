import * as React from "react"
import { buttonStyle } from "./common"

/**
 * @public
 */
export function DialogContainer(props: {
  children: React.ReactNode
}) {
  const [visible, setVisible] = React.useState(false)
  return (
    <>
      <button style={buttonStyle} onClick={() => setVisible(true)}>📖</button>
      {visible && <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}
        onClick={() => setVisible(false)}
      >
        <div style={{ width: '600px', height: '400px', background: 'white' }} onClick={(e) => e.stopPropagation()}>
          {props.children}
        </div>
      </div>}
    </>
  )
}
