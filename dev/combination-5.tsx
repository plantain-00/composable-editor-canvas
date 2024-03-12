import React from 'react'
import { Nullable } from '../src'
import { AstronomicalObjectSimulator, AstronomicalObjectSimulatorRef } from './astronomical-object-simulator/astronomical-object-simulator'
import { BaseContent } from './astronomical-object-simulator/model'
import { astronomicalObjectData } from './astronomical-object-simulator/data'

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

export function Combination5() {
  const [initialState] = React.useState<Nullable<BaseContent>[]>(astronomicalObjectData)
  const editorRef = React.useRef<AstronomicalObjectSimulatorRef | null>(null)

  return (
    <div>
      <AstronomicalObjectSimulator
        operator={me}
        ref={editorRef}
        initialState={initialState}
      />
    </div>
  )
}
