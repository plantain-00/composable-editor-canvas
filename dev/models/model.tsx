import React from 'react'
import { Position, ReactRenderTarget, TwoPointsFormRegion } from '../../src'

export interface BaseContent<T extends string = string> {
  type: T
}

export interface Model<T> {
  type: string
  move(content: Omit<T, 'type'>, offset: Position): void
  rotate(content: Omit<T, 'type'>, center: Position, angle: number): void
  explode?(content: Omit<T, 'type'>): BaseContent[]
  mirror(content: Omit<T, 'type'>, p1: Position, p2: Position): void
  canSelectByPosition(content: Omit<T, 'type'>, position: Position, delta: number): boolean
  canSelectByTwoPositions(content: Omit<T, 'type'>, region: TwoPointsFormRegion, partial: boolean): boolean
  render?(props: { content: Omit<T, 'type'>, stroke: number, target: ReactRenderTarget }): JSX.Element
  useEdit?(onEnd: () => void): {
    mask?: JSX.Element
    updatePreview(contents: T[]): void
    editBar(props: { content: T, index: number }): JSX.Element
  }
  useCreate?(type: string | undefined, onEnd: (contents: T[]) => void): {
    input?: JSX.Element
    updatePreview(contents: T[]): void
    onClick: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
    onMove: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
  }
}

const modelCenter: Record<string, Model<BaseContent>> = {}

export function getModel(type: string): Model<BaseContent> | undefined {
  return modelCenter[type]
}

export function useModelsEdit(onEnd: () => void) {
  const editMasks: JSX.Element[] = []
  const updateEditPreviews: ((contents: BaseContent[]) => void)[] = []
  const editBarMap: Record<string, (props: { content: BaseContent, index: number }) => JSX.Element> = {}
  Object.values(modelCenter).forEach((model) => {
    if (!model.useEdit) {
      return
    }
    const { mask, updatePreview, editBar } = model.useEdit(onEnd)
    if (mask) {
      editMasks.push(React.cloneElement(mask, { key: model.type }))
    }
    updateEditPreviews.push(updatePreview)
    editBarMap[model.type] = editBar
  })
  return {
    editMasks,
    updateEditPreview(contents: BaseContent[]) {
      for (const updateEditPreview of updateEditPreviews) {
        updateEditPreview(contents)
      }
    },
    editBarMap,
  }
}

export function useModelsCreate(operation: string | undefined, onEnd: (contents: BaseContent[]) => void) {
  const createInputs: JSX.Element[] = []
  const updateCreatePreviews: ((contents: BaseContent[]) => void)[] = []
  const onClicks: ((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void)[] = []
  const onMoves: ((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void)[] = []
  Object.entries(modelCenter).forEach(([type, model]) => {
    if (!model.useCreate) {
      return
    }
    const { input, updatePreview, onClick, onMove } = model.useCreate(operation, onEnd)
    if (input) {
      createInputs.push(React.cloneElement(input, { key: type }))
    }
    updateCreatePreviews.push(updatePreview)
    onClicks.push(onClick)
    onMoves.push(onMove)
  })
  return {
    createInputs,
    updateCreatePreview(contents: BaseContent[]) {
      for (const updateCreatePreview of updateCreatePreviews) {
        updateCreatePreview(contents)
      }
    },
    onStartCreate(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) {
      for (const onClick of onClicks) {
        onClick(e)
      }
    },
    onCreatingMove(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) {
      for (const onMove of onMoves) {
        onMove(e)
      }
    },
  }
}

export function registerModel<T extends BaseContent>(model: Model<T>) {
  modelCenter[model.type] = model
}
