import { Patch } from "immer"
import React from "react"
import { ContentPath, Nullable, Position, prependPatchPath, SelectPath, Size, Transform, TwoPointsFormRegion } from "../../src"
import { BaseContent, fixedButtomStyle, fixedInputStyle, PartRef, Select, SnapTarget } from "./model"

export interface Command extends CommandType {
  type?: CommandType[]
  useCommand?(props: CommandProps): CommandResult
  execute?(props: {
    contents: Nullable<BaseContent>[],
    state: readonly Nullable<BaseContent>[]
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

interface CommandEndOptions {
  updateContents: (contents: Nullable<BaseContent>[], selected: readonly ContentPath[]) => void,
  nextCommand: string,
  repeatedly: boolean,
}

interface CommandProps {
  onEnd: (options?: Partial<CommandEndOptions>) => void,
  transform: (p: Position) => Position,
  type: string | undefined,
  selected: { content: BaseContent, path: ContentPath }[],
  setSelected: (...value: readonly Nullable<ContentPath>[]) => void
  scale: number,
  strokeStyleId: number | undefined,
  fillStyleId: number | undefined,
  textStyleId: number | undefined,
  contents: readonly Nullable<BaseContent>[],
  backgroundColor: number,
  acquireContent: (select: Select, handle: (refs: readonly PartRef[]) => void) => void,
  acquireRegion: (handle: (region: Position[]) => void) => void,
  transformPosition: (p: Position) => Position,
  getContentsInRange: (region?: TwoPointsFormRegion) => readonly Nullable<BaseContent>[]
  contentVisible: (c: BaseContent) => boolean
}

interface CommandResult {
  onStart(p: Position, target?: SnapTarget): void
  onMove?: (p: Position, viewportPosition?: Position, target?: SnapTarget) => void
  onMouseDown?: (p: Position) => void
  onMouseUp?: (p: Position) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onKeyUp?: (e: KeyboardEvent) => void
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
  selected?: ContentPath[]
  hovering?:ContentPath[]
  lastPosition?: Position
  reset?(saveCurrent?: boolean): void
}

export interface CommandType {
  name: string
  hotkey?: string
  icon?: JSX.Element
}

const commandCenter: Record<string, Command> = {}
const commandHotkeys: Record<string, string> = {}

export function getCommand(name: string): Command | undefined {
  return commandCenter[name]
}

export function useCommands(
  onEnd: (
    options?: Partial<CommandEndOptions>
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
  transformPosition: (p: Position) => Position,
  getContentsInRange: (region?: TwoPointsFormRegion) => readonly Nullable<BaseContent>[],
  contentVisible: (c: BaseContent) => boolean,
  setSelected: (...value: readonly Nullable<ContentPath>[]) => void,
) {
  let commandResult: CommandResult | undefined
  Object.values(commandCenter).forEach((command) => {
    if (command.useCommand) {
      const type = operation && (operation === command.name || command.type?.some((c) => c.name === operation)) ? operation : undefined
      const r = command.useCommand({
        onEnd,
        transform,
        type,
        selected,
        setSelected,
        scale,
        strokeStyleId,
        fillStyleId,
        textStyleId,
        contents,
        backgroundColor,
        acquireContent,
        acquireRegion,
        transformPosition,
        getContentsInRange,
        contentVisible,
      })
      if (type) {
        commandResult = r
      }
    }
  })
  return {
    commandMask: commandResult?.mask,
    commandInput: commandResult?.input ? React.cloneElement<React.HTMLAttributes<unknown>>(commandResult.input, inputFixed ? { style: fixedInputStyle } : {}, ...commandResult.input.props.children) : undefined,
    commandButtons: commandResult?.subcommand ? React.cloneElement(commandResult.subcommand, { style: inputFixed ? fixedButtomStyle : fixedInputStyle }) : undefined,
    commandPanel: commandResult?.panel,
    commandUpdateSelectedContent(contents: readonly Nullable<BaseContent>[]) {
      const assistentContents: BaseContent[] = []
      const patches: [Patch[], Patch[]][] = []
      let index = 0
      const s = selected.map(e => e.content)
      for (const { content, path } of selected) {
        if (commandResult?.updateSelectedContent) {
          const result = commandResult.updateSelectedContent(content, contents, s)
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
    commandAssistentContents: commandResult?.assistentContents,
    commandSelected: commandResult?.selected,
    commandHovering: commandResult?.hovering,
    startCommand: commandResult?.onStart,
    onCommandMouseMove: commandResult?.onMove,
    onCommandMouseDown: commandResult?.onMouseDown,
    onCommandMouseUp: commandResult?.onMouseUp,
    onCommandKeyDown: commandResult?.onKeyDown,
    onCommandKeyUp: commandResult?.onKeyUp,
    getCommandByHotkey: (key: string) => commandHotkeys[key.toUpperCase()],
    commandLastPosition: commandResult?.lastPosition,
    resetCommand: commandResult?.reset,
  }
}

export function registerCommand(command: Command) {
  commandCenter[command.name] = command
  if (command.type) {
    for (const type of command.type) {
      if (type.hotkey) {
        commandHotkeys[type.hotkey] = type.name
      }
    }
  } else if (command.hotkey) {
    commandHotkeys[command.hotkey] = command.name
  }
}
