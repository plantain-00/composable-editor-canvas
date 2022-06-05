import { applyPatches, produceWithPatches } from "immer"
import React from "react"
import { usePartialEdit } from "../src"

export default () => {
  interface Content {
    value: number
    children?: Content[]
  }
  const [content, setContent] = React.useState<Content>({
    value: 1,
    children: [
      { value: 10 },
      { value: 100 }
    ]
  })
  const { editingContent, setEditingContentPath, prependPatchPath } = usePartialEdit(content)
  const addOne = () => {
    const [, patches] = produceWithPatches(editingContent, (draft) => {
      draft.value++
    })
    setContent(applyPatches(content, prependPatchPath(patches)))
  }

  return (
    <>
      <button onClick={addOne}>+1</button>
      <button onClick={() => setEditingContentPath([])}>exit</button>
      <div>
        {editingContent.value}
        {editingContent.children && editingContent.children.map((c, i) => (
          <button key={i} style={{ width: '50px', height: '50px' }} onClick={() => setEditingContentPath(['children', i])}>{c.value}</button>
        ))}
      </div>
    </>
  )
}
