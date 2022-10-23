import { Patch } from "immer"
import React from "react"
import { Nullable, Position, prependPatchPath, SelectPath } from "../../src"
import { BaseContent, fixedInputStyle } from "../models/model"

export interface Command extends CommandType {
  type?: CommandType[]
  useCommand?(props: {
    onEnd: (options?: Partial<{
      updateContents?: (contents: Nullable<BaseContent>[], selected: readonly number[][]) => void,
      nextCommand?: string,
      repeatedly?: boolean,
    }>) => void,
    transform: (p: Position) => Position,
    type: string | undefined,
    selected: { content: BaseContent, path: number[] }[],
    scale: number,
  }): {
    onStart(p: Position): void
    onMove?: (p: Position, viewportPosition?: Position) => void
    mask?: JSX.Element
    input?: React.ReactElement<{ children: React.ReactNode[] }>
    subcommand?: JSX.Element
    updateSelectedContent?(content: Readonly<BaseContent>, contents: readonly Nullable<BaseContent>[]): {
      assistentContents?: BaseContent[]
      newContents?: BaseContent[]
      patches?: [Patch[], Patch[]]
    }
    assistentContents?: BaseContent[]
    lastPosition?: Position
    reset?(): void
  }
  execute?(props: {
    contents: Nullable<BaseContent>[],
    selected: readonly number[][],
    setEditingContentPath: (path: SelectPath | undefined) => void
    type: string | undefined,
  }): void
  contentSelectable?(content: BaseContent, contents: readonly Nullable<BaseContent>[]): boolean
  selectCount?: number
  selectType?: 'select part'
}

export interface CommandType {
  name: string
  hotkey?: string
  icon?: JSX.Element
}

const commandCenter: Record<string, Command> = {}

export function getCommand(name: string): Command | undefined {
  return commandCenter[name]
}

export function useCommands(
  onEnd: (
    options?: Partial<{
      updateContents?: (contents: Nullable<BaseContent>[], selected: readonly number[][]) => void,
      nextCommand?: string,
      repeatedly?: boolean,
    }>
  ) => void,
  transform: (p: Position) => Position,
  inputFixed: boolean | undefined,
  operation: string | undefined,
  selected: { content: BaseContent, path: number[] }[],
  scale: number,
) {
  const commandInputs: JSX.Element[] = []
  const masks: JSX.Element[] = []
  const onMoves: ((p: Position, viewportPosition?: Position) => void)[] = []
  const updateSelectedContents: ((content: BaseContent, contents: readonly Nullable<BaseContent>[]) => {
    assistentContents?: BaseContent[] | undefined;
    newContents?: BaseContent[] | undefined;
    patches?: [Patch[], Patch[]]
  })[] = []
  const commandAssistentContents: BaseContent[] = []
  const onStartMap: Record<string, ((p: Position) => void)> = {}
  const hotkeys: { key: string, command: string }[] = []
  const lastPositions: Position[] = []
  const resets: (() => void)[] = []
  Object.values(commandCenter).forEach((command) => {
    if (command.useCommand) {
      const type = operation && (operation === command.name || command.type?.some((c) => c.name === operation)) ? operation : undefined
      const { onStart, mask, updateSelectedContent, assistentContents, input, subcommand, onMove, lastPosition, reset } = command.useCommand({
        onEnd,
        transform,
        type,
        selected,
        scale,
      })
      if (mask) {
        masks.push(React.cloneElement(mask, { key: command.name }))
      }
      if (type) {
        onStartMap[command.name] = onStart
        if (command.type) {
          for (const type of command.type) {
            onStartMap[type.name] = onStart
          }
        }
        if (updateSelectedContent) {
          updateSelectedContents.push(updateSelectedContent)
        }
      }
      if (onMove) {
        onMoves.push(onMove)
      }
      if (assistentContents) {
        commandAssistentContents.push(...assistentContents)
      }
      if (lastPosition) {
        lastPositions.push(lastPosition)
      }
      if (reset) {
        resets.push(reset)
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
      } else if (subcommand) {
        const props: Record<string, unknown> = {
          key: command.name + 'sub command',
        }
        props.style = fixedInputStyle
        commandInputs.push(React.cloneElement(subcommand, props))
      }
    }
    if (command.type) {
      for (const type of command.type) {
        if (type.hotkey) {
          hotkeys.push({ key: type.hotkey, command: type.name })
        }
      }
    } else if (command.hotkey) {
      hotkeys.push({ key: command.hotkey, command: command.name })
    }
  })
  return {
    commandMasks: masks,
    commandInputs,
    updateSelectedContents(contents: readonly Nullable<BaseContent>[]) {
      const assistentContents: BaseContent[] = []
      const patches: [Patch[], Patch[]][] = []
      let index = 0
      for (const { content, path } of selected) {
        for (const updateSelectedContent of updateSelectedContents) {
          const result = updateSelectedContent(content, contents)
          if (result.assistentContents) {
            assistentContents.push(...result.assistentContents)
          }
          if (result.patches) {
            patches.push([prependPatchPath(result.patches[0], path), prependPatchPath(result.patches[1], path)])
          }
          if (result.newContents) {
            patches.push(...result.newContents.map((c, i) => [
              [{
                op: 'add',
                path: [contents.length + i + index],
                value: c,
              }],
              [{
                op: 'remove',
                path: [contents.length + i + index],
              }]
            ] as [Patch[], Patch[]]))
            index += result.newContents.length
          }
        }
      }
      return {
        assistentContents,
        patches,
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
    getCommandByHotkey(key: string) {
      key = key.toUpperCase()
      return hotkeys.find((k) => k.key === key)?.command
    },
    commandLastPosition: lastPositions[0],
    resetCommands() {
      resets.forEach(r => {
        r()
      })
    }
  }
}

export function registerCommand(command: Command) {
  commandCenter[command.name] = command
}
