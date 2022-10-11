import * as React from "react"
import { groupStyle } from "./common"

/**
 * @public
 */
export function ObjectEditor(props: {
  properties: Record<string, JSX.Element | JSX.Element[]>
  inline?: boolean
}) {
  if (props.inline) {
    return (
      <table style={groupStyle}>
        <thead></thead>
        <tbody>
          {Object.entries(props.properties).map(([title, child]) => {
            if (Array.isArray(child)) {
              child = child.map((c, i) => React.cloneElement(c, { key: i }))
            }
            return (
              <tr key={title}>
                <td style={{ paddingRight: '5px' }}>{title}</td>
                <td style={{ display: 'flex', flexDirection: 'column' }}>{child}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
  return (
    <div style={groupStyle}>
      {Object.entries(props.properties).map(([title, child]) => {
        if (Array.isArray(child)) {
          child = child.map((c, i) => React.cloneElement(c, { key: i }))
        }
        return (
          <React.Fragment key={title}>
            <div style={{ marginTop: '5px', marginBottom: '5px' }}>{title}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>{child}</div>
          </React.Fragment>
        )
      })}
    </div>
  )
}
