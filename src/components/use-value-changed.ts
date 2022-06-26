import * as React from "react"

/**
 * @public
 */
export function useValueChanged<T>(
  value: T,
  callback: (lastValue: T) => true | void,
) {
  const lastValue = React.useRef<T>(value)
  if (lastValue.current !== value) {
    const currentValueIgnored = callback(lastValue.current)
    if (!currentValueIgnored) {
      lastValue.current = value
    }
  }
}
