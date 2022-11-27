import React from "react"

export const Cursor = React.forwardRef((
  props: React.HTMLAttributes<HTMLInputElement> & { readOnly?: boolean },
  ref: React.ForwardedRef<HTMLInputElement>,
) => {
  const [focused, setFocused] = React.useState(false)
  return (
    <>
      <input
        ref={ref}
        style={{
          ...props.style,
          border: 0,
          outline: 'none',
          width: '0px',
          position: 'absolute',
          opacity: 0,
        }}
        readOnly={props.readOnly}
        onKeyDown={props.onKeyDown}
        onCompositionEnd={props.onCompositionEnd}
        onBlur={e => {
          props.onBlur?.(e)
          setFocused(false)
        }}
        onFocus={e => {
          props.onFocus?.(e)
          setFocused(true)
        }}
      />
      <style>
        {`@-webkit-keyframes blink {
            0%, 49.9%, 100%   { opacity: 0; }
            50%, 99.9% { opacity: 1; }
        }`}
      </style>
      <span style={{
        display: !focused || props.readOnly ? 'none' : 'inline-block',
        position: 'absolute',
        width: '1px',
        animation: 'blink 1s infinite',
        borderLeft: '1px solid black',
        userSelect: 'none',
        ...props.style,
      }}></span>
    </>
  )
})
