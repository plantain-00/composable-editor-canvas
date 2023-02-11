import React from "react";

export function useRefState<T>(value: T) {
  const [state, setState] = React.useState(value)
  const ref = React.useRef(value)

  return [
    state,
    (s: T) => {
      setState(s)
      ref.current = s
    },
    ref,
  ] as const
}

export function useRefState2<T>() {
  const [state, setState] = React.useState<T>()
  const ref = React.useRef<T>()

  return [
    state,
    (s: T | undefined) => {
      setState(s)
      ref.current = s
    },
    ref,
  ] as const
}
