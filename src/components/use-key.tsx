import * as React from "react"

export function useKey(
  filter: (e: KeyboardEvent) => boolean,
  handler: (e: KeyboardEvent) => void,
) {
  React.useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (filter(e)) {
        handler(e)
      }
    }
    window.addEventListener('keydown', keyHandler)
    return () => {
      window.removeEventListener('keydown', keyHandler)
    }
  }, [filter])
}
