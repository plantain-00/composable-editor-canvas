import * as React from "react"

/**
 * @public
 */
export function useLastValidValue<T>(
  value: T,
  isValid: (value: T) => boolean,
  defaultValue = value,
) {
  const lastValidValue = React.useRef<T>(defaultValue)
  if (isValid(value)) {
    lastValidValue.current = value
  }
  return lastValidValue.current
}
