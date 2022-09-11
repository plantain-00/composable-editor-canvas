import produce, { castDraft, Draft } from "immer"
import React from "react"

interface JsonEditorProps<T> {
  value: T
  setValue: (value: T) => void
}

const controlStyle: React.CSSProperties = {
  display: 'block',
  outline: 0,
  padding: '0.375rem 0.75rem',
  fontSize: '1rem',
  fontWeight: 400,
  lineHeight: 1.5,
  color: '#212529',
  backgroundColor: '#fff',
  backgroundClip: 'padding-box',
  border: '1px solid #ced4da',
  appearance: 'none',
  borderRadius: '0.25rem',
}
const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  fontWeight: 400,
  lineHeight: 1,
  color: '#212529',
  textAlign: 'center',
  textDecoration: 'none',
  verticalAlign: 'middle',
  cursor: 'pointer',
  userSelect: 'none',
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  padding: '0.375rem 0.75rem',
  fontSize: '1rem',
  borderRadius: '0.25rem',
}

function StringEditor(props: JsonEditorProps<string> & {
  type?: React.HTMLInputTypeAttribute
  textarea?: boolean
}) {
  if (props.textarea) {
    return (
      <textarea
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
        style={controlStyle}
      />
    )
  }
  let preview: JSX.Element | undefined
  if (props.value.startsWith('http')) {
    preview = <img src={props.value} style={{ display: 'block', height: 'auto', margin: '6px 0px', maxWidth: '100%' }} />
  }
  return (
    <>
      <input
        value={props.value}
        type={props.type ?? 'text'}
        onChange={(e) => props.setValue(e.target.value)}
        style={controlStyle}
      />
      {preview}
    </>
  )
}

function NumberEditor(props: JsonEditorProps<number>) {
  return (
    <input
      value={props.value}
      onChange={(e) => props.setValue(+e.target.value)}
      style={controlStyle}
    />
  )
}

function BooleanEditor(props: JsonEditorProps<boolean>) {
  return (
    <input
      type='checkbox'
      checked={props.value}
      onChange={(e) => props.setValue(e.target.checked)}
    />
  )
}

function EnumArrayEditor<T extends string>(props: JsonEditorProps<T[]> & {
  enums: readonly T[]
  enumTitles?: readonly string[]
}) {
  return (
    <div>
      {props.enums.map((e, i) => (
        <label key={e} style={{ marginRight: '10px' }}>
          <input
            type='checkbox'
            checked={props.value.includes(e)}
            style={{ marginRight: '5px' }}
            onChange={() => {
              const index = props.value.indexOf(e)
              props.setValue(produce(props.value, draft => {
                if (index >= 0) {
                  draft.splice(index, 1)
                } else {
                  draft.push(castDraft(e))
                }
              }))
            }}
          />
          {props.enumTitles?.[i] ?? e}
        </label>
      ))}
    </div>
  )
}

function EnumEditor<T extends string>(props: JsonEditorProps<T> & {
  enums: readonly T[]
  enumTitles?: readonly string[]
}) {
  return (
    <div>
      {props.enums.map((e, i) => (
        <label key={e} style={{ marginRight: '10px' }}>
          <input
            type='radio'
            checked={props.value === e}
            style={{ marginRight: '5px' }}
            onChange={() => props.setValue(e)}
          />
          {props.enumTitles?.[i] ?? e}
        </label>
      ))}
    </div>
  )
}

const groupStyle: React.CSSProperties = { padding: '10px', border: '1px solid rgba(0,0,0,.125)', borderRadius: '0.25rem' }

function ObjectEditor(props: {
  properties: Record<string, JSX.Element>
  inline?: boolean
}) {
  if (props.inline) {
    return (
      <table style={groupStyle}>
        <thead></thead>
        <tbody>
          {Object.entries(props.properties).map(([title, child]) => {
            return (
              <tr key={title}>
                <td style={{ paddingRight: '5px' }}>{title}</td>
                <td>{child}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
  return (
    <div style={groupStyle}>
      {Object.entries(props.properties).map(([title, child]) => {
        return (
          <React.Fragment key={title}>
            <div style={{ marginTop: '5px', marginBottom: '5px' }}>{title}</div>
            <div>{child}</div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

interface ArrayProps {
  add: () => void
  remove: (index: number) => void
  copy: (index: number) => void
  moveUp: (index: number) => void
  moveDown: (index: number) => void
}

function ArrayEditor(props: ArrayProps & {
  items: JSX.Element[]
  title?: (index: number) => string
  inline?: boolean
}) {
  if (props.inline) {
    return (
      <div style={groupStyle}>
        <table>
          <thead>
          </thead>
          <tbody>
            {props.items.map((p, i) => {
              return (
                <tr key={i}>
                  <td style={{ paddingRight: '5px' }}>{i + 1}</td>
                  <td>{p}</td>
                  <td>
                    <button style={buttonStyle} onClick={() => props.remove(i)}>❌</button>
                    <button style={buttonStyle} onClick={() => props.copy(i)}>©</button>
                    {i > 0 && <button style={buttonStyle} onClick={() => props.moveUp(i)}>⬆</button>}
                    {i < props.items.length - 1 && <button style={buttonStyle} onClick={() => props.moveDown(i)}>⬇</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button style={buttonStyle} onClick={props.add}>➕</button>
      </div>
    )
  }
  return (
    <div style={groupStyle}>
      {props.items.map((p, i) => {
        return (
          <React.Fragment key={i}>
            <div style={{ marginBottom: '5px', marginTop: '5px' }}>
              {props.title?.(i) ?? (i + 1)}
              <button style={{ marginLeft: '5px', ...buttonStyle }} onClick={() => props.remove(i)}>❌</button>
              <button style={buttonStyle} onClick={() => props.copy(i)}>©</button>
              {i > 0 && <button style={buttonStyle} onClick={() => props.moveUp(i)}>⬆</button>}
              {i < props.items.length - 1 && <button style={buttonStyle} onClick={() => props.moveDown(i)}>⬇</button>}
            </div>
            <div>{p}</div>
          </React.Fragment>
        )
      })}
      <button style={buttonStyle} onClick={props.add}>➕</button>
    </div>
  )
}

function ObjectArrayEditor(props: ArrayProps & {
  properties: Record<string, JSX.Element>[]
}) {
  if (props.properties.length === 0) {
    return null
  }
  return (
    <div style={groupStyle}>
      <table>
        <thead>
          <tr>
            <td></td>
            {Object.entries(props.properties[0]).map(([title]) => <td key={title}>{title}</td>)}
            <td></td>
          </tr>
        </thead>
        <tbody>
          {props.properties.map((p, i) => {
            return (
              <tr key={i}>
                <td style={{ paddingRight: '5px' }}>{i + 1}</td>
                {Object.values(p).map((v, j) => <td key={j}>{v}</td>)}
                <td>
                  <button style={buttonStyle} onClick={() => props.remove(i)}>❌</button>
                  <button style={buttonStyle} onClick={() => props.copy(i)}>©</button>
                  {i > 0 && <button style={buttonStyle} onClick={() => props.moveUp(i)}>⬆</button>}
                  {i < props.properties.length - 1 && <button style={buttonStyle} onClick={() => props.moveDown(i)}>⬇</button>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <button style={buttonStyle} onClick={props.add}>➕</button>
    </div>
  )
}

function DialogContainer(props: {
  children: React.ReactNode
}) {
  const [visible, setVisible] = React.useState(false)
  return (
    <>
      <button style={buttonStyle} onClick={() => setVisible(true)}>📖</button>
      {visible && <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}
        onClick={() => setVisible(false)}
      >
        <div style={{ width: '600px', height: '400px', background: 'white' }} onClick={(e) => e.stopPropagation()}>
          {props.children}
        </div>
      </div>}
    </>
  )
}

export default () => {
  const [value, setValue] = React.useState({
    stringExample: 'a string example',
    booleanExample: false,
    numberExample: 123.4,
    objectExample: {
      propertyExample1: '',
      propertyExample2: 0,
    },
    inlineObjectExample: {
      propertyExample1: '',
      propertyExample2: 0,
    },
    arrayExample: ['item1', 'item2'],
    inlineArrayExample: ['item1', 'item2'],
    enumExample: 'enum 1' as 'enum 1' | 'enum 2',
    colorExample: '#000000',
    textareaExample: '',
    imagePreviewExample: 'http://image2.sina.com.cn/bj/art/2004-08-02/U91P52T4D51657F160DT20040802125523.jpg',
    itemTitleExample: [
      {
        propertyExample1: 'foo',
        propertyExample2: 1,
      },
      {
        propertyExample1: 'bar',
        propertyExample2: 2,
      },
    ],
    inlineObjectArrayExample: [
      {
        propertyExample1: 'foo',
        propertyExample2: 1,
        propertyExample3: {
          propertyExample4: 2,
          propertyExample5: '',
        },
      },
      {
        propertyExample1: 'bar',
        propertyExample2: 2,
        propertyExample3: {
          propertyExample4: 3,
          propertyExample5: '',
        },
      },
    ],
    enumTitlesExample: 'enum 1' as 'enum 1' | 'enum 2',
    enumArrayExample: ['foo'] as ('foo' | 'bar')[],
  })

  const update = <T,>(recipe: (draft: Draft<typeof value>, v: T) => void) => {
    return (v: T) => {
      setValue(produce(value, (draft) => {
        recipe(draft, v)
      }))
    }
  }
  const getArrayProps = <T,>(getArray: (v: typeof value) => T[], defaultValue: T) => {
    return {
      add: () => setValue(produce(value, draft => {
        getArray(draft).push(defaultValue)
      })),
      remove: (i: number) => setValue(produce(value, draft => {
        getArray(draft).splice(i, 1)
      })),
      copy: (i: number) => setValue(produce(value, draft => {
        const array = getArray(draft)
        array.splice(i, 0, array[i])
      })),
      moveUp: (i: number) => setValue(produce(value, draft => {
        const array = getArray(draft)
        array.splice(i - 1, 0, array[i])
        array.splice(i + 1, 1)
      })),
      moveDown: (i: number) => setValue(produce(value, draft => {
        const array = getArray(draft)
        array.splice(i + 2, 0, array[i])
        array.splice(i, 1)
      })),
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ width: '100%' }}>
        <ObjectEditor
          properties={{
            'A string example': <StringEditor value={value.stringExample} setValue={update((draft, v) => draft.stringExample = v)} />,
            'A boolean example': <BooleanEditor value={value.booleanExample} setValue={update((draft, v) => draft.booleanExample = v)} />,
            'A number example': <NumberEditor value={value.numberExample} setValue={update((draft, v) => draft.numberExample = v)} />,
            'A object example': <ObjectEditor
              properties={{
                'Property example 1': <StringEditor value={value.objectExample.propertyExample1} setValue={update((draft, v) => draft.objectExample.propertyExample1 = v)} />,
                'Property example 2': <NumberEditor value={value.objectExample.propertyExample2} setValue={update((draft, v) => draft.objectExample.propertyExample2 = v)} />,
              }}
            />,
            'A inline object example': <ObjectEditor
              inline
              properties={{
                'Property example 1': <StringEditor value={value.inlineObjectExample.propertyExample1} setValue={update((draft, v) => draft.inlineObjectExample.propertyExample1 = v)} />,
                'Property example 2': <NumberEditor value={value.inlineObjectExample.propertyExample2} setValue={update((draft, v) => draft.inlineObjectExample.propertyExample2 = v)} />,
              }}
            />,
            'A array example': <ArrayEditor
              {...getArrayProps(v => v.arrayExample, '')}
              items={value.arrayExample.map((f, i) => <StringEditor value={f} setValue={update((draft, v) => draft.arrayExample[i] = v)} />)}
            />,
            'A inline array example': <ArrayEditor
              inline
              {...getArrayProps(v => v.inlineArrayExample, '')}
              items={value.inlineArrayExample.map((f, i) => <StringEditor value={f} setValue={update((draft, v) => draft.inlineArrayExample[i] = v)} />)}
            />,
            'A enum example': <EnumEditor value={value.enumExample} enums={['enum 1', 'enum 2'] as const} setValue={update((draft, v) => draft.enumExample = v)} />,
            'A color example': <StringEditor type='color' value={value.colorExample} setValue={update((draft, v) => draft.colorExample = v)} />,
            'A textarea example': <StringEditor textarea value={value.textareaExample} setValue={update((draft, v) => draft.textareaExample = v)} />,
            'A image preview example': <StringEditor value={value.imagePreviewExample} setValue={update((draft, v) => draft.imagePreviewExample = v)} />,
            'A item title example': <ArrayEditor
              {...getArrayProps(v => v.itemTitleExample, { propertyExample1: '', propertyExample2: 0 })}
              title={(i) => value.itemTitleExample[i].propertyExample1}
              items={value.itemTitleExample.map((f, i) => <ObjectEditor
                properties={{
                  'Property example 1': <StringEditor value={f.propertyExample1} setValue={update((draft, v) => draft.itemTitleExample[i].propertyExample1 = v)} />,
                  'Property example 2': <NumberEditor value={f.propertyExample2} setValue={update((draft, v) => draft.itemTitleExample[i].propertyExample2 = v)} />,
                }}
              />)}
            />,
            'A inline object array example': <ObjectArrayEditor
              {...getArrayProps(v => v.inlineObjectArrayExample, { propertyExample1: '', propertyExample2: 0, propertyExample3: { propertyExample4: 0, propertyExample5: '' } })}
              properties={value.inlineObjectArrayExample.map((f, i) => ({
                'Property example 1': <StringEditor value={f.propertyExample1} setValue={update((draft, v) => draft.inlineObjectArrayExample[i].propertyExample1 = v)} />,
                'Property example 2': <NumberEditor value={f.propertyExample2} setValue={update((draft, v) => draft.inlineObjectArrayExample[i].propertyExample2 = v)} />,
                'Property example 3': <DialogContainer><ObjectEditor
                  inline
                  properties={{
                    'Property example 3': <NumberEditor value={f.propertyExample3.propertyExample4} setValue={update((draft, v) => draft.inlineObjectArrayExample[i].propertyExample3.propertyExample4 = v)} />,
                    'Property example 4': <StringEditor value={f.propertyExample3.propertyExample5} setValue={update((draft, v) => draft.inlineObjectArrayExample[i].propertyExample3.propertyExample5 = v)} />,
                  }}
                /></DialogContainer>,
              }))}
            />,
            'A enum titles example': <EnumEditor enumTitles={['enum title 1', 'enum title 2']} value={value.enumTitlesExample} enums={['enum 1', 'enum 2'] as const} setValue={update((draft, v) => draft.enumTitlesExample = v)} />,
            'A enum array example': <EnumArrayEditor enumTitles={['foo title', 'bar title']} value={value.enumArrayExample} enums={['foo', 'bar'] as const} setValue={update((draft, v) => draft.enumArrayExample = v)} />,
          }}
        />
      </div>
      <pre style={{ width: '300px' }}><code>{JSON.stringify(value, null, 2)}</code></pre>
    </div>
  )
}
