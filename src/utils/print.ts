import { isFunction, isRecord } from "./is-record"

export function printJsToCode(value: unknown, options?: Partial<{
  functionPrinter: FunctionPrinter
  space: string | number
}>) {
  const space = options?.space
  let indent: string | undefined
  if (typeof space === 'number' && !isNaN(space) && space >= 1) {
    indent = ''
    const spaceCount = Math.min(Math.floor(space), 10)
    for (let i = 0; i < spaceCount; i++) {
      indent += ' '
    }
  } else if (typeof space === 'string') {
    indent = space.substring(0, 10)
  }
  return printJsToCodeInternally(value, options?.functionPrinter, indent, '')
}

type FunctionPrinter = ((value: (...args: unknown[]) => unknown) => string) | undefined

function printJsToCodeInternally(value: unknown, functionPrinter: FunctionPrinter, baseIndent: string | undefined, indent: string): string {
  if (value === undefined) {
    return 'undefined'
  }
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'boolean'
    || value instanceof Boolean
    || typeof value === 'number'
    || value instanceof Number) {
    return `${value.toString()}`
  }
  if (typeof value === 'string' || value instanceof String) {
    return escapeQuote(value.toString())
  }
  if (value instanceof Date) {
    return `new Date(${escapeQuote(value.toISOString())})`
  }
  if (typeof value === 'symbol') {
    return `Symbol(${value.description ? escapeQuote(value.description) : ''})`
  }
  if (isFunction(value)) {
    if (functionPrinter) {
      return functionPrinter(value)
    }
    return 'undefined'
  }
  const currentIndent = baseIndent === undefined ? indent : indent + baseIndent
  if (Array.isArray(value)) {
    return printArrayToCode(value, functionPrinter, baseIndent, indent, currentIndent)
  }
  if (isRecord(value)) {
    return printObjectToCode(value, functionPrinter, baseIndent, indent, currentIndent)
  }
  return ''
}

function printArrayToCode(value: unknown[], functionPrinter: FunctionPrinter, baseIndent: string | undefined, indent: string, currentIndent: string) {
  let result = '['
  for (let i = 0; i < value.length; i++) {
    const v = value[i]
    if (baseIndent !== undefined) {
      result += `\n${currentIndent}`
    }
    result += printJsToCodeInternally(v, functionPrinter, baseIndent, currentIndent)
    if (i !== value.length - 1) {
      result += ','
    }
  }
  if (baseIndent !== undefined && value.length > 0) {
    result += `\n${indent}`
  }
  return result + ']'
}

function printObjectToCode(value: Record<string, unknown>, functionPrinter: FunctionPrinter, baseIndent: string | undefined, indent: string, currentIndent: string) {
  let result = '{'
  let canEmitComma = false
  for (const key in value) {
    const v = value[key]
    if (v === undefined || (typeof v === 'function' && !functionPrinter)) {
      continue
    }
    if (canEmitComma) {
      result += ','
    }
    const field = isValidIdentifier(key) ? key : escapeQuote(key)
    if (baseIndent !== undefined) {
      result += `\n${currentIndent}${field}: `
    } else {
      result += `${field}:`
    }
    canEmitComma = true
    result += printJsToCodeInternally(v, functionPrinter, baseIndent, currentIndent)
  }
  if (baseIndent !== undefined && Object.keys(value).length > 0) {
    result += `\n${indent}`
  }
  return result + '}'
}

// eslint-disable-next-line no-control-regex,no-misleading-character-class
const quoteEscapeRegExp = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

const meta: { [key: string]: string | undefined } = {
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
  '"': '\\"',
  '\\': '\\\\'
}

function escapeQuote(str: string) {
  quoteEscapeRegExp.lastIndex = 0
  return quoteEscapeRegExp.test(str)
    ? '"' + str.replace(quoteEscapeRegExp, a => {
      const c = meta[a]
      return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4)
    }) + '"'
    : '"' + str + '"'
}

function isValidIdentifier(identifier: string) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore 1501
  return /^[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*$/u.test(identifier)
}
