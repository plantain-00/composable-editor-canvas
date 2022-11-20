import { StyleGuide } from "./model"

export const styleGuide: StyleGuide = {
  name: 'test',
  templates: [
    {
      id: '1',
      name: '组件',
      x: 0,
      y: 0,
      width: 500,
      height: 300,
      contents: [
        {
          kind: 'text',
          text: 'test',
          fontFamily: 'serif',
          fontSize: 50,
          color: '#ff0000',
          width: 100,
          height: 100,
          x: 10,
          y: 10,
        },
        {
          kind: 'image',
          url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
          width: 100,
          height: 100,
          x: 210,
          y: 10,
        }
      ],
    },
    {
      id: '2',
      name: '模板',
      x: 600,
      y: 0,
      width: 1100,
      height: 400,
      contents: [
        {
          kind: 'color',
          x: 0,
          y: 0,
          width: 1100,
          height: 400,
          color: '#cccccc',
        },
        {
          kind: 'reference',
          id: '1',
          x: 10,
          y: 10,
        },
        {
          kind: 'snapshot',
          rotate: 30,
          snapshot: {
            id: '1',
            name: '组件',
            x: 0,
            y: 0,
            width: 500,
            height: 300,
            contents: [
              {
                kind: 'text',
                text: 'test',
                fontFamily: 'serif',
                fontSize: 50,
                color: '#ff0000',
                width: 100,
                height: 100,
                x: 10,
                y: 10,
              },
              {
                kind: 'image',
                url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
                width: 100,
                height: 100,
                x: 210,
                y: 10,
              }
            ],
          },
          x: 550,
          y: 10
        }
      ]
    }
  ],
}
