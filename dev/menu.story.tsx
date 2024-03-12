import React from "react"
import { Menu } from "../src"

export default () => {
  return (
    <Menu
      items={[
        {
          title: 'item 1',
          children: [
            { title: 'item 1 child 1' },
            {
              title: 'item 1 child 2',
              children: [
                { title: 'item 1 child 2 child 1' },
                { title: 'item 1 child 2 child 2' },
              ]
            },
          ]
        },
        {
          title: 'item 2',
          children: [
            { title: 'item 2 child 1' },
            { title: 'item 2 child 2 disabled', disabled: true },
          ]
        },
        {
          type: 'divider'
        },
        { title: 'item 3' },
      ]}
      style={{ left: '100px', top: '100px' }}
    />
  )
}
