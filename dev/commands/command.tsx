import React from "react"
import { Position } from "../../src"
import { BaseContent, fixedInputStyle, getAngleSnap } from "../models/model"

export interface Command {
  name: string
  useCommand?(
    onEnd: (updateContents?: (contents: BaseContent[], isSelected: (i: number) => boolean) => void) => void,
    transform: (p: Position) => Position,
    getAngleSnap: ((angle: number) => number | undefined) | undefined,
    enabled: boolean,
  ): {
    onStart(p: Position): void
    onMove?: (p: Position, viewportPosition?: Position) => void
    mask?: JSX.Element
    input?: React.ReactElement<{ children: React.ReactNode[] }>
    subcommand?: JSX.Element
    updateContent?(content: BaseContent, contents: readonly BaseContent[]): {
      assistentContents?: BaseContent[]
      newContents?: BaseContent[]
    }
    assistentContents?: BaseContent[]
  }
  executeCommand?(content: BaseContent, contents: readonly BaseContent[], index: number): {
    removed?: boolean
    newContents?: BaseContent[]
    editingStatePath?: (string | number)[]
  }
  contentSelectable?(content: BaseContent, contents: readonly BaseContent[]): boolean
  selectOperation?: 'select one'
}

const commandCenter: Record<string, Command> = {}

export function getCommand(name: string): Command | undefined {
  return commandCenter[name]
}

export function useCommands(
  onEnd: (updateContents?: (contents: BaseContent[], isSelected: (i: number) => boolean) => void) => void,
  transform: (p: Position) => Position,
  angleSnapEnabled: boolean,
  inputFixed: boolean,
  operation?: string,
) {
  const commandInputs: JSX.Element[] = []
  const masks: JSX.Element[] = []
  const onMoves: ((p: Position, viewportPosition?: Position) => void)[] = []
  const updateContents: ((content: BaseContent, contents: readonly BaseContent[]) => {
    assistentContents?: BaseContent[] | undefined;
    newContents?: BaseContent[] | undefined;
  })[] = []
  const commandAssistentContents: BaseContent[] = []
  const onStartMap: Record<string, ((p: Position) => void)> = {}
  Object.values(commandCenter).forEach((command) => {
    if (command.useCommand) {
      const { onStart, mask, updateContent, assistentContents, input, subcommand, onMove } = command.useCommand(onEnd, transform, angleSnapEnabled ? getAngleSnap : undefined, operation === command.name)
      if (mask) {
        masks.push(React.cloneElement(mask, { key: command.name }))
      }
      onStartMap[command.name] = onStart
      if (updateContent) {
        updateContents.push(updateContent)
      }
      if (onMove) {
        onMoves.push(onMove)
      }
      if (assistentContents) {
        commandAssistentContents.push(...assistentContents)
      }
      if (input) {
        const children: React.ReactNode[] = [...input.props.children]
        if (subcommand) {
          const props: Record<string, unknown> = {
            key: command.name + 'sub command',
          }
          if (inputFixed) {
            children.push(React.cloneElement(subcommand, props))
          } else {
            props.style = fixedInputStyle
            commandInputs.push(React.cloneElement(subcommand, props))
          }
        }
        const props: Record<string, unknown> = {
          key: command.name,
        }
        if (inputFixed) {
          props.style = fixedInputStyle
        }
        commandInputs.push(React.cloneElement(input, props, ...children))
      }
    }
  })
  return {
    commandMasks: masks,
    commandInputs,
    updateContent(content: BaseContent, contents: readonly BaseContent[]) {
      const assistentContents: BaseContent[] = []
      const newContents: BaseContent[] = []
      for (const updateContent of updateContents) {
        const result = updateContent(content, contents)
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
    commandAssistentContents,
    startCommand(name: string | undefined, p: Position) {
      if (name && onStartMap[name]) {
        onStartMap[name](p)
      }
    },
    onCommandMove(p: Position, viewportPosition?: Position) {
      for (const onMove of onMoves) {
        onMove(p, viewportPosition)
      }
    },
  }
}

export function registerCommand(command: Command) {
  commandCenter[command.name] = command
}
