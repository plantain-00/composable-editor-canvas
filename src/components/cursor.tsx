import React from "react"

export function Cursor(props: {
  style?: React.CSSProperties
}) {
  return (
    <>
      <style>
        {`@-webkit-keyframes blink {
            0%, 49.9%, 100%   { opacity: 0; }
            50%, 99.9% { opacity: 1; }
        }`}
      </style>
      <div style={{
        display: 'inline-block',
        position: 'absolute',
        width: '1px',
        animation: 'blink 1s infinite',
        borderLeft: '1px solid black',
        userSelect: 'none',
        ...props.style,
      }}></div>
    </>
  )
}
