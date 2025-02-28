import React from "react"
import { produce } from "immer"
import { Button } from "../src"

export default () => {
  const ROW = 3, COLUMN = 3
  const [data, setData] = React.useState(new Array<number>(ROW * COLUMN).fill(0))
  const [status, setStatus] = React.useState<'set' | 'solve'>('solve')
  const [answer, setAnswer] = React.useState<number[]>()
  const flip = (draft: number[], index: number) => {
    draft[index] = draft[index] ? 0 : 1
    if (status === 'solve') {
      const i = Math.floor(index / COLUMN)
      const j = index % COLUMN
      if (j + 1 < COLUMN) {
        draft[index + 1] = draft[index + 1] ? 0 : 1
      }
      if (j >= 1) {
        draft[index - 1] = draft[index - 1] ? 0 : 1
      }
      if (i + 1 < ROW) {
        draft[index + COLUMN] = draft[index + COLUMN] ? 0 : 1
      }
      if (i >= 1) {
        draft[index - COLUMN] = draft[index - COLUMN] ? 0 : 1
      }
    }
  }
  const random = () => {
    setData(data.map(() => Math.round(Math.random())))
    setAnswer(undefined)
  }
  const solve = () => {
    setAnswer(undefined)
    const count = 2 ** data.length
    for (let i = 1; i <= count; i++) {
      const bytes = i.toString(2)
      const indexes: number[] = []
      const newData = produce(data, draft => {
        for (let j = 0; j < bytes.length; j++) {
          if (bytes[bytes.length - j - 1] === '1') {
            indexes.push(j)
            flip(draft, j)
          }
        }
      })
      if (newData.every(r => r)) {
        setAnswer(indexes)
        return
      }
    }
  }
  return (
    <div>
      <Button onClick={random}>random game</Button>
      <Button onClick={() => {
        setStatus(status === 'set' ? 'solve' : 'set')
        setAnswer(undefined)
      }}>{status === 'set' ? 'done' : 'set game'}</Button>
      {status === 'solve' && <Button onClick={solve}>solve game</Button>}
      {answer && <span>{answer.map(a => a + 1).join(',')}</span>}
      <div
        style={{
          border: '1px solid #808080',
          display: 'flex',
          width: `${50 * COLUMN}px`,
          flexFlow: 'wrap',
        }}
      >
        {data.map((cell, i) => <div
          key={i}
          style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            lineHeight: '50px',
            textAlign: 'center',
            border: '1px solid #808080',
            backgroundColor: cell ? 'green' : '',
            color: cell ? 'white' : '',
            cursor: 'pointer',
            boxSizing: 'border-box',
            userSelect: 'none',
          }}
          onClick={() => setData(produce(data, draft => flip(draft, i)))}
        >{i + 1}</div>)}
      </div>
    </div>
  )
}
