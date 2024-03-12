import React from "react"

export function Menu(props: {
  items: (MenuItem | MenuDivider)[]
  style?: React.CSSProperties
}) {
  const [hovering, setHovering] = React.useState(-1)
  return (
    <ul
      style={{
        position: 'absolute',
        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
        borderRadius: '0.375rem',
        border: '1px solid rgba(0, 0, 0, 0.175)',
        background: 'white',
        padding: '0.5em 0',
        ...props.style,
      }}
      onMouseLeave={() => setHovering(-1)}
    >
      {props.items.map((item, i) => {
        if (item.type === 'divider') {
          return (
            <li
              key={i}
              style={{
                listStyle: 'none',
              }}
            >
              <hr style={{ height: 0, margin: '0.5em 0', border: 0, borderTop: '1px solid rgba(0, 0, 0, 0.175)' }} />
            </li>
          )
        }
        return (
          <li
            key={i}
            style={{
              padding: '0 0.5em',
              paddingRight: '1.5em',
              position: 'relative',
              listStyle: 'none',
              background: hovering === i ? '#f8f9fa' : undefined,
              color: item.disabled ? 'rgba(33, 37, 41, 0.5)' : undefined,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              lineHeight: '32px',
            }}
            onMouseEnter={() => setHovering(i)}
            onClick={item.onClick}
          >
            <span>{item.title}</span>
            {item.children && item.children.length > 0 && <svg style={{ right: '0.5em', height: '100%', position: 'absolute' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width='10' height='10'>
              <polyline points="2,0 8,5 2,10" stroke="currentColor" fill="none"></polyline>
            </svg>}
            {hovering === i && item.children && item.children.length > 0 && <Menu
              items={item.children}
              style={{ top: 0, left: '100%' }}
            />}
          </li>
        )
      })}
    </ul>
  )
}

export interface MenuItem {
  type?: 'item'
  title: string
  onClick?: React.MouseEventHandler<HTMLElement>
  children?: (MenuItem | MenuDivider)[]
  disabled?: boolean
}

export interface MenuDivider {
  type: 'divider'
}
