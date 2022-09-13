import * as React from "react"
import { groupStyle } from "./common"

/**
 * @public
 */
export function ObjectEditor(props: {
  properties: Record<string, JSX.Element>
  inline?: boolean
}) {
  if (props.inline) {
    return (
      <table style={groupStyle}>
        <thead></thead>
        <tbody>
          {Object.entries(props.properties).map(([title, child]) => {
            return (
              <tr key={title}>
                <td style={{ paddingRight: '5px' }}>{title}</td>
                <td>{child}</td>
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
        return (
          <React.Fragment key={title}>
            <div style={{ marginTop: '5px', marginBottom: '5px' }}>{title}</div>
            <div>{child}</div>
          </React.Fragment>
        )
      })}
    </div>
  )
}
