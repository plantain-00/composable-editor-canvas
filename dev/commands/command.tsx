import React from "react"
import { Position } from "../../src"
import { BaseContent, getAngleSnap } from "../models/model"

export interface Command {
  name: string
  useCommand?(
    onEnd: () => void,
    transform: (p: Position) => Position,
    getAngleSnap: ((angle: number) => number | undefined) | undefined,
    enabled: boolean,
  ): {
    onStart(p: Position): void
    mask?: JSX.Element
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
  transform: (p: Position) => Position,
  angleSnapEnabled: boolean,
  operation?: string,
) {
  const masks: JSX.Element[] = []
  const updateContents: ((content: BaseContent) => {
    assistentContents?: BaseContent[] | undefined;
    newContents?: BaseContent[] | undefined;
  })[] = []
  const onStartMap: Record<string, ((p: Position) => void)> = {}
  Object.values(commandCenter).forEach((command) => {
    if (command.useCommand) {
      const { onStart, mask, updateContent } = command.useCommand(onEnd, transform, angleSnapEnabled ? getAngleSnap : undefined, operation === command.name)
      if (mask) {
        masks.push(React.cloneElement(mask, { key: command.name }))
      }
      onStartMap[command.name] = onStart
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
    startCommand(name: string | undefined, p: Position) {
      if (name && onStartMap[name]) {
        onStartMap[name](p)
      }
    },
  }
}

export function registerCommand(command: Command) {
  commandCenter[command.name] = command
}
