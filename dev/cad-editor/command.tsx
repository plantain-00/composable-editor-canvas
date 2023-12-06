import { Patch } from "immer"
import React from "react"
import { ContentPath, Nullable, Position, prependPatchPath, SelectPath, Size, Transform } from "../../src"
import { BaseContent, fixedInputStyle, PartRef, Select, SnapTarget } from "./model"

export interface Command extends CommandType {
  type?: CommandType[]
  useCommand?(props: {
    onEnd: (options?: Partial<{
      updateContents?: (contents: Nullable<BaseContent>[], selected: readonly ContentPath[]) => void,
      nextCommand?: string,
      repeatedly?: boolean,
    }>) => void,
    transform: (p: Position) => Position,
    type: string | undefined,
    selected: { content: BaseContent, path: ContentPath }[],
    scale: number,
    strokeStyleId: number | undefined,
    fillStyleId: number | undefined,
    textStyleId: number | undefined,
    contents: readonly Nullable<BaseContent>[],
    backgroundColor: number,
    acquireContent: (select: Select, handle: (refs: readonly PartRef[]) => void) => void,
    acquireRegion: (handle: (region: Position[]) => void) => void,
    transformPosition: (p: Position) => Position,
  }): {
    onStart(p: Position, target?: SnapTarget): void
    onMove?: (p: Position, viewportPosition?: Position, target?: SnapTarget) => void
    onMouseDown?: (p: Position) => void
    onMouseUp?: (p: Position) => void
    onKeyDown?: (e: KeyboardEvent) => void
    mask?: JSX.Element
    input?: React.ReactElement<{ children: React.ReactNode[] }>
    subcommand?: JSX.Element
    panel?: JSX.Element
    updateSelectedContent?(content: Readonly<BaseContent>, contents: readonly Nullable<BaseContent>[], selected: BaseContent[]): {
      assistentContents?: BaseContent[]
      newContents?: BaseContent[]
      patches?: [Patch[], Patch[]]
    }
    assistentContents?: BaseContent[]
    lastPosition?: Position
    reset?(saveCurrent?: boolean): void
  }
  execute?(props: {
    contents: Nullable<BaseContent>[],
    selected: readonly number[][],
    setEditingContentPath: (path: SelectPath | undefined) => void
    type: string | undefined,
    strokeStyleId: number | undefined,
    fillStyleId: number | undefined,
    textStyleId: number | undefined,
    transform: Transform
  } & Size): void
  contentSelectable?(content: BaseContent, contents: readonly Nullable<BaseContent>[]): boolean
  selectCount?: number
  selectType?: 'select part'
  pointSnapDisabled?: boolean
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
      updateContents?: (contents: Nullable<BaseContent>[], selected: readonly ContentPath[]) => void,
      nextCommand?: string,
      repeatedly?: boolean,
    }>
  ) => void,
  transform: (p: Position) => Position,
  inputFixed: boolean | undefined,
  operation: string | undefined,
  selected: { content: BaseContent, path: ContentPath }[],
  scale: number,
  strokeStyleId: number | undefined,
  fillStyleId: number | undefined,
  textStyleId: number | undefined,
  contents: readonly Nullable<BaseContent>[],
  backgroundColor: number,
  acquireContent: (select: Select, handle: (refs: readonly PartRef[]) => void) => void,
  acquireRegion: (handle: (region: Position[]) => void) => void,
  transformPosition: (p: Position) => Position
) {
  const commandInputs: JSX.Element[] = []
  const panels: JSX.Element[] = []
  const masks: JSX.Element[] = []
  const onMoves: ((p: Position, viewportPosition?: Position, target?: SnapTarget) => void)[] = []
  const onMouseDowns: ((p: Position) => void)[] = []
  const onMouseUps: ((p: Position) => void)[] = []
  const onKeyDowns: ((e: KeyboardEvent) => void)[] = []
  const updateSelectedContents: ((content: BaseContent, contents: readonly Nullable<BaseContent>[], selected: BaseContent[]) => {
    assistentContents?: BaseContent[] | undefined;
    newContents?: BaseContent[] | undefined;
    patches?: [Patch[], Patch[]]
  })[] = []
  const commandAssistentContents: BaseContent[] = []
  const onStartMap: Record<string, ((p: Position, target?: SnapTarget) => void)> = {}
  const hotkeys: { key: string, command: string }[] = []
  const lastPositions: Position[] = []
  const resets: ((saveCurrent?: boolean) => void)[] = []
  Object.values(commandCenter).forEach((command) => {
    if (command.type) {
      for (const type of command.type) {
        if (type.hotkey) {
          hotkeys.push({ key: type.hotkey, command: type.name })
        }
      }
    } else if (command.hotkey) {
      hotkeys.push({ key: command.hotkey, command: command.name })
    }
    if (command.useCommand) {
      const type = operation && (operation === command.name || command.type?.some((c) => c.name === operation)) ? operation : undefined
      const { onStart, mask, updateSelectedContent, assistentContents, panel, input, subcommand, onMove, onMouseDown, onMouseUp, onKeyDown, lastPosition, reset } = command.useCommand({
        onEnd,
        transform,
        type,
        selected,
        scale,
        strokeStyleId,
        fillStyleId,
        textStyleId,
        contents,
        backgroundColor,
        acquireContent,
        acquireRegion,
        transformPosition,
      })
      if (!type) return
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
      if (onMouseDown) {
        onMouseDowns.push(onMouseDown)
      }
      if (onMouseUp) {
        onMouseUps.push(onMouseUp)
      }
      if (onKeyDown) {
        onKeyDowns.push(onKeyDown)
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
      if (panel) {
        panels.push(React.cloneElement(panel, { key: command.name }))
      }
    }
  })
  return {
    commandMasks: masks,
    commandInputs,
    panels,
    updateSelectedContents(contents: readonly Nullable<BaseContent>[]) {
      const assistentContents: BaseContent[] = []
      const patches: [Patch[], Patch[]][] = []
      let index = 0
      const s = selected.map(e => e.content)
      for (const { content, path } of selected) {
        for (const updateSelectedContent of updateSelectedContents) {
          const result = updateSelectedContent(content, contents, s)
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
    startCommand(name: string | undefined, p: Position, target?: SnapTarget) {
      if (name && onStartMap[name]) {
        onStartMap[name](p, target)
      }
    },
    onCommandMove(p: Position, viewportPosition?: Position, target?: SnapTarget) {
      for (const onMove of onMoves) {
        onMove(p, viewportPosition, target)
      }
    },
    onCommandDown(p: Position) {
      for (const onMouseDown of onMouseDowns) {
        onMouseDown(p)
      }
    },
    onCommandUp(p: Position) {
      for (const onMouseUp of onMouseUps) {
        onMouseUp(p)
      }
    },
    onCommandKeyDown(e: KeyboardEvent) {
      for (const onKeyDown of onKeyDowns) {
        onKeyDown(e)
      }
    },
    getCommandByHotkey(key: string) {
      key = key.toUpperCase()
      return hotkeys.find((k) => k.key === key)?.command
    },
    commandLastPosition: lastPositions[0],
    resetCommands(saveCurrent?: boolean) {
      resets.forEach(r => {
        r(saveCurrent)
      })
    }
  }
}

export function registerCommand(command: Command) {
  commandCenter[command.name] = command
}
