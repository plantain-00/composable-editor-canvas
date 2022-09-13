import * as React from "react"
import { buttonStyle, groupStyle } from "./common"

interface ArrayProps {
  add: () => void
  remove: (index: number) => void
  copy: (index: number) => void
  moveUp: (index: number) => void
  moveDown: (index: number) => void
}

/**
 * @public
 */
export function ArrayEditor(props: ArrayProps & {
  items: JSX.Element[]
  title?: (index: number) => string
  inline?: boolean
}) {
  if (props.inline) {
    return (
      <div style={groupStyle}>
        <table>
          <thead>
          </thead>
          <tbody>
            {props.items.map((p, i) => {
              return (
                <tr key={i}>
                  <td style={{ paddingRight: '5px' }}>{i + 1}</td>
                  <td>{p}</td>
                  <td>
                    <button style={buttonStyle} onClick={() => props.remove(i)}>❌</button>
                    <button style={buttonStyle} onClick={() => props.copy(i)}>©</button>
                    {i > 0 && <button style={buttonStyle} onClick={() => props.moveUp(i)}>⬆</button>}
                    {i < props.items.length - 1 && <button style={buttonStyle} onClick={() => props.moveDown(i)}>⬇</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button style={buttonStyle} onClick={props.add}>➕</button>
      </div>
    )
  }
  return (
    <div style={groupStyle}>
      {props.items.map((p, i) => {
        return (
          <React.Fragment key={i}>
            <div style={{ marginBottom: '5px', marginTop: '5px' }}>
              {props.title?.(i) ?? (i + 1)}
              <button style={{ marginLeft: '5px', ...buttonStyle }} onClick={() => props.remove(i)}>❌</button>
              <button style={buttonStyle} onClick={() => props.copy(i)}>©</button>
              {i > 0 && <button style={buttonStyle} onClick={() => props.moveUp(i)}>⬆</button>}
              {i < props.items.length - 1 && <button style={buttonStyle} onClick={() => props.moveDown(i)}>⬇</button>}
            </div>
            <div>{p}</div>
          </React.Fragment>
        )
      })}
      <button style={buttonStyle} onClick={props.add}>➕</button>
    </div>
  )
}

/**
 * @public
 */
export function ObjectArrayEditor(props: ArrayProps & {
  properties: Record<string, JSX.Element>[]
}) {
  if (props.properties.length === 0) {
    return null
  }
  return (
    <div style={groupStyle}>
      <table>
        <thead>
          <tr>
            <td></td>
            {Object.entries(props.properties[0]).map(([title]) => <td key={title}>{title}</td>)}
            <td></td>
          </tr>
        </thead>
        <tbody>
          {props.properties.map((p, i) => {
            return (
              <tr key={i}>
                <td style={{ paddingRight: '5px' }}>{i + 1}</td>
                {Object.values(p).map((v, j) => <td key={j}>{v}</td>)}
                <td>
                  <button style={buttonStyle} onClick={() => props.remove(i)}>❌</button>
                  <button style={buttonStyle} onClick={() => props.copy(i)}>©</button>
                  {i > 0 && <button style={buttonStyle} onClick={() => props.moveUp(i)}>⬆</button>}
                  {i < props.properties.length - 1 && <button style={buttonStyle} onClick={() => props.moveDown(i)}>⬇</button>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <button style={buttonStyle} onClick={props.add}>➕</button>
    </div>
  )
}
