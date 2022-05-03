import React from "react"
import { Position } from "../../src"
import { BaseContent } from "../models/model"

export interface Command {
  name: string
  useCommand?(
    onEnd: () => void,
    getSnapPoint: (p: { clientX: number, clientY: number }) => { clientX: number, clientY: number },
    enabled: boolean,
  ): {
    start(e: { clientX: number, clientY: number }): void
    mask?: JSX.Element
    setStartPosition: React.Dispatch<React.SetStateAction<Position | undefined>>
    updateContent(content: BaseContent): {
      assistentContents?: BaseContent[]
      newContents?: BaseContent[]
    }
  }
  execuateCommand?(content: BaseContent): {
    removed?: boolean
    newContents?: BaseContent[]
  }
  contentSelectable?(content: BaseContent): boolean
}

const commandCenter: Record<string, Command> = {}

export function getCommand(name: string): Command | undefined {
  return commandCenter[name]
}

export function useCommands(
  onEnd: () => void,
  getSnapPoint: (p: { clientX: number, clientY: number }) => { clientX: number, clientY: number },
  operation?: string,
) {
  const masks: JSX.Element[] = []
  const setStartPositions: React.Dispatch<React.SetStateAction<Position | undefined>>[] = []
  const updateContents: ((content: BaseContent) => {
    assistentContents?: BaseContent[] | undefined;
    newContents?: BaseContent[] | undefined;
  })[] = []
  const startMap: Record<string, ((e: { clientX: number, clientY: number }) => void)> = {}
  Object.values(commandCenter).forEach((command) => {
    if (command.useCommand) {
      const { start, mask, setStartPosition, updateContent } = command.useCommand(onEnd, getSnapPoint, operation === command.name)
      if (mask) {
        masks.push(React.cloneElement(mask, { key: command.name }))
      }
      setStartPositions.push(setStartPosition)
      startMap[command.name] = start
      updateContents.push(updateContent)
    }
  })
  return {
    commandMasks: masks,
    updateContent(content: BaseContent) {
      const assistentContents: BaseContent[] = []
      const newContents: BaseContent[] = []
      for (const updateContent of updateContents) {
        const result = updateContent(content)
        if (result.assistentContents) {
          assistentContents.push(...result.assistentContents)
        }
        if (result.newContents) {
          newContents.push(...result.newContents)
        }
      }
      return {
        assistentContents,
        newContents,
      }
    },
    startCommand(name: string | undefined, e: { clientX: number, clientY: number }) {
      if (name && startMap[name]) {
        startMap[name](e)
        for (const setStartPosition of setStartPositions) {
          setStartPosition({ x: e.clientX, y: e.clientY })
        }
      }
    },
  }
}

export function registerCommand(command: Command) {
  commandCenter[command.name] = command
}
