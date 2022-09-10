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

function ObjectEditor(props: {
  properties: Record<string, JSX.Element>
}) {
  return (
    <div style={{ padding: '10px', border: '1px solid rgba(0,0,0,.125)', borderRadius: '0.25rem' }}>
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

function ArrayEditor(props: {
  add: () => void
  remove: (index: number) => void
  items: JSX.Element[]
  title?: (index: number) => string
}) {
  return (
    <div style={{ padding: '10px', border: '1px solid rgba(0,0,0,.125)', borderRadius: '0.25rem' }}>
      {props.items.map((p, i) => {
        return (
          <React.Fragment key={i}>
            <div style={{ marginBottom: '5px', marginTop: '5px' }}>
              {props.title?.(i) ?? i}
              <button style={{ marginLeft: '5px', ...buttonStyle }} onClick={() => props.remove(i)} >❌</button>
            </div>
            <div>{p}</div>
          </React.Fragment>
        )
      })}
      <button style={buttonStyle} onClick={props.add}  >➕</button>
    </div>
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
    arrayExample: ['item1', 'item2'],
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
      {
        propertyExample1: 'baz',
        propertyExample2: 1,
      },
    ],
    enumTitlesExample: 'enum 1' as 'enum 1' | 'enum 2',
    enumArrayExample: ['foo'] as ('foo' | 'bar')[],
  })

  const change = (recipe: (draft: Draft<typeof value>) => void) => {
    setValue(produce(value, (draft) => {
      recipe(draft)
    }))
  }
  const update = <T,>(recipe: (draft: Draft<typeof value>, v: T) => void) => {
    return (v: T) => {
      setValue(produce(value, (draft) => {
        recipe(draft, v)
      }))
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
                'Property exmaple 1': <StringEditor value={value.objectExample.propertyExample1} setValue={update((draft, v) => draft.objectExample.propertyExample1 = v)} />,
                'Property exmaple 2': <NumberEditor value={value.objectExample.propertyExample2} setValue={update((draft, v) => draft.objectExample.propertyExample2 = v)} />,
              }}
            />,
            'A array example': <ArrayEditor
              add={() => change(draft => draft.arrayExample.push(''))}
              remove={(i) => change(draft => draft.arrayExample.splice(i, 1))}
              items={value.arrayExample.map((f, i) => <StringEditor value={f} setValue={update((draft, v) => draft.arrayExample[i] = v)} />)}
            />,
            'A enum example': <EnumEditor value={value.enumExample} enums={['enum 1', 'enum 2'] as const} setValue={update((draft, v) => draft.enumExample = v)} />,
            'A color example': <StringEditor type='color' value={value.colorExample} setValue={update((draft, v) => draft.colorExample = v)} />,
            'A textarea example': <StringEditor textarea value={value.textareaExample} setValue={update((draft, v) => draft.textareaExample = v)} />,
            'A image preview example': <StringEditor value={value.imagePreviewExample} setValue={update((draft, v) => draft.imagePreviewExample = v)} />,
            'A item title example': <ArrayEditor
              add={() => change(draft => draft.itemTitleExample.push({ propertyExample1: '', propertyExample2: 0 }))}
              remove={(i) => change(draft => draft.itemTitleExample.splice(i, 1))}
              title={(i) => value.itemTitleExample[i].propertyExample1}
              items={value.itemTitleExample.map((f, i) => <ObjectEditor
                properties={{
                  'Property exmaple 1': <StringEditor value={f.propertyExample1} setValue={update((draft, v) => draft.itemTitleExample[i].propertyExample1 = v)} />,
                  'Property exmaple 2': <NumberEditor value={f.propertyExample2} setValue={update((draft, v) => draft.itemTitleExample[i].propertyExample2 = v)} />,
                }}
              />)}
            />,
            'A enum titles example': <EnumEditor enumTitles={['enum title 1', 'enum title 2']} value={value.enumTitlesExample} enums={['enum 1', 'enum 2'] as const} setValue={update((draft, v) => draft.enumTitlesExample = v)} />,
            'A enum array example': <EnumArrayEditor enumTitles={['foo title', 'bar title']} value={value.enumArrayExample} enums={['foo', 'bar'] as const} setValue={update((draft, v) => draft.enumArrayExample = v)} />,
          }}
        />
      </div>
      <pre><code>{JSON.stringify(value, null, 2)}</code></pre>
    </div>
  )
}
