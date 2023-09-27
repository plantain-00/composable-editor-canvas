import { Expression2 } from "expression-engine"

export interface Factor {
  constant?: number
  variables: (string | FactorVariable)[]
}

export interface FactorVariable {
  power: number
  value: Factor[]
}

export function divide(e1: Expression2, e2: Expression2): Expression2 | void {
  const f1 = expressionToFactors(e1)
  if (!f1) return
  const f2 = expressionToFactors(e2)
  if (!f2) return
  const result = divideFactors(f1, f2)
  if (result) {
    return factorsToExpression(result)
  }
}

export function extractFactors(factors: Factor[], power: number): { base: Factor, factors: Factor[] } | void {
  let last: ExtractFactor | undefined
  for (const factor of factors) {
    const r = extractFactor(factor, power)
    if (!r) return
    if (!last) {
      last = r
    } else {
      const newFactor: ExtractFactor = {
        variables: {},
        constant: getCommonDivisor(last.constant, r.constant),
      }
      for (const [v, count] of Object.entries(r.variables)) {
        const lastCount = last.variables[v]
        if (lastCount) {
          newFactor.variables[v] = Math.min(lastCount, count)
        }
      }
      last = newFactor
    }
  }
  if (last && (Object.keys(last.variables).length > 0 || last.constant > 1)) {
    const base: Factor = {
      constant: last.constant ** (1 / power),
      variables: []
    }
    const full: Factor = {
      constant: last.constant,
      variables: []
    }
    for (const [key, count] of Object.entries(last.variables)) {
      base.variables.push(...new Array<string>(count).fill(key))
      full.variables.push(...new Array<string>(count * power).fill(key))
    }
    const remain = divideFactors(factors, [full])
    if (!remain) return
    return {
      base,
      factors: remain,
    }
  }
}

interface ExtractFactor {
  variables: Record<string, number>
  constant: number
}

function extractFactor(factor: Factor, power: number): ExtractFactor | void {
  const map = new Map<string, number>()
  for (const variable of factor.variables) {
    if (typeof variable !== 'string') {
      return
    }
    map.set(variable, (map.get(variable) ?? 0) + 1)
  }
  const constant = factor.constant ?? 1
  const result: ExtractFactor = {
    variables: {},
    constant: Number.isInteger(constant) && constant ? Math.abs(constant) : 1,
  }
  for (const [variable, count] of map) {
    if (count >= power) {
      result.variables[variable] = Math.floor(count / power)
    }
  }
  if (Object.keys(result.variables).length > 0) {
    return result
  }
}

export function divideFactors(f1: Factor[], f2: Factor[]): Factor[] | void {
  for (const factor1 of f1) {
    const factor = divideFactor(factor1, f2[0])
    if (factor) {
      const remains = substractFactors(f1, f2.map(f => multiplyFactor(f, factor)))
      if (remains.length === 0) {
        return [factor]
      }
      if (remains.length > f1.length) continue
      const factors = divideFactors(remains, f2)
      if (!factors) continue
      return [factor, ...factors]
    }
  }
}

function substractFactor(f1: Factor, f2: Factor): number | void {
  const e = divideFactor(f1, f2)
  if (e && e.variables.length === 0) {
    return (f1.constant ?? 1) - (f2.constant ?? 1)
  }
}

function addFactor(f1: Factor, f2: Factor): number | void {
  const e = divideFactor(f1, f2)
  if (e && e.variables.length === 0) {
    return (f1.constant ?? 1) + (f2.constant ?? 1)
  }
}

function substractFactors(f1: Factor[], f2: Factor[]): Factor[] {
  const result = [...f1]
  for (const f of f2) {
    let handled = false
    for (let i = 0; i < result.length; i++) {
      const r = result[i]
      const e = substractFactor(r, f)
      if (e !== undefined) {
        if (e === 0) {
          result.splice(i, 1)
        } else {
          result[i] = {
            constant: e === 1 ? undefined : e,
            variables: [...r.variables],
          }
        }
        handled = true
        break
      }
    }
    if (!handled) {
      result.push({
        constant: -(f.constant ?? 1),
        variables: [...f.variables],
      })
    }
  }
  return result
}

function divideFactor(f1: Factor, f2: Factor): Factor | undefined {
  if (f1.variables.length < f2.variables.length) return
  const variables = [...f1.variables]
  for (const v of f2.variables) {
    let index = variables.indexOf(v)
    if (index >= 0) {
      variables.splice(index, 1)
    } else {
      for (let i = 0; i < variables.length; i++) {
        const f = variables[i]
        if (typeof f === 'string' || typeof v !== 'string') {
          continue
        }
        const r = divideFactors(f.value, [{ variables: new Array<string>(1 / f.power).fill(v) }])
        if (r) {
          index = i
          variables[i] = {
            power: f.power,
            value: r,
          }
          break
        }
      }
      if (index < 0) {
        return
      }
    }
  }
  const constant = (f1.constant ?? 1) / (f2.constant ?? 1)
  return {
    variables,
    constant: constant === 1 ? undefined : constant,
  }
}

export function expressionToFactors(e: Expression2): Factor[] | undefined {
  if (e.type === 'BinaryExpression' && (e.operator === '+' || e.operator === '-')) {
    const left = expressionToFactors(e.left)
    if (!left) return
    let right = expressionToFactors(e.right)
    if (!right) return
    if (e.operator === '-') {
      right = right.map(r => reverseFactor(r))
    }
    return [...left, ...right]
  }
  const factor = expressionToFactor(e)
  if (factor) {
    return [factor]
  }
  return
}

function expressionToFactor(e: Expression2): Factor | void {
  if (e.type === 'NumericLiteral') {
    return {
      constant: e.value,
      variables: [],
    }
  }
  if (e.type === 'Identifier') {
    return {
      variables: [e.name],
    }
  }
  if (e.type === 'UnaryExpression' && e.operator === '-') {
    const argument = expressionToFactor(e.argument)
    if (!argument) return
    return reverseFactor(argument)
  }
  if (e.type === 'BinaryExpression') {
    if (e.operator === '*') {
      const left = expressionToFactor(e.left)
      if (!left) return
      const right = expressionToFactor(e.right)
      if (!right) return
      return multiplyFactor(left, right)
    }
    if (e.operator === '**') {
      if (e.right.type === 'NumericLiteral' && e.right.value < 1) {
        const left = expressionToFactors(e.left)
        if (!left) return
        return {
          variables: [{
            value: left,
            power: e.right.value,
          }]
        }
      }
      const left = expressionToFactor(e.left)
      if (!left) return
      if (e.right.type !== 'NumericLiteral') return
      if (!Number.isInteger(e.right.value)) return
      if (e.right.value < 1) return
      return powerFactor(left, e.right.value)
    }
  }
}

export function factorsToExpression(f: Factor[]): Expression2 {
  if (f.length === 0) {
    return {
      type: 'NumericLiteral',
      value: 0,
    }
  }
  if (f.length === 1) {
    return factorToExpression(f[0])
  }
  const [v, ...remains] = f
  return {
    type: 'BinaryExpression',
    left: factorToExpression(v),
    operator: '+',
    right: factorsToExpression(remains),
  }
}

export function factorToExpression(f: Factor): Expression2 {
  if (f.variables.length === 0) {
    return {
      type: 'NumericLiteral',
      value: f.constant ?? 1,
    }
  }
  if (f.constant !== undefined) {
    return {
      type: 'BinaryExpression',
      left: {
        type: 'NumericLiteral',
        value: f.constant,
      },
      operator: '*',
      right: factorToExpression({
        variables: f.variables,
      })
    }
  }
  if (f.variables.length === 1) {
    const v = f.variables[0]
    if (typeof v !== 'string') {
      return {
        type: 'BinaryExpression',
        left: factorsToExpression(v.value),
        operator: '**',
        right: {
          type: 'NumericLiteral',
          value: v.power,
        },
      }
    }
    return {
      type: 'Identifier',
      name: v,
    }
  }
  const [v, ...remains] = [...f.variables]
  return {
    type: 'BinaryExpression',
    left: factorToExpression({
      variables: [v],
    }),
    operator: '*',
    right: factorToExpression({
      variables: remains,
    }),
  }
}

function powerFactor(factor: Factor, power: number): Factor {
  let constant = 1
  const variables: (string | FactorVariable)[] = []
  for (let i = 0; i < power; i++) {
    if (factor.constant !== undefined) {
      constant *= factor.constant
    }
    variables.push(...factor.variables)
  }
  return {
    variables,
    constant,
  }
}

function multiplyFactor(...factors: Factor[]): Factor {
  let constant = 1
  const variables: (string | FactorVariable)[] = []
  for (const f of factors) {
    if (f.constant !== undefined) {
      constant *= f.constant
    }
    variables.push(...f.variables)
  }
  return {
    variables,
    constant: constant === 1 ? undefined : constant,
  }
}

function reverseFactor(factor: Factor) {
  return multiplyFactor(factor, { constant: -1, variables: [] })
}

export function optimizeFactors(factors: Factor[]) {
  const result: Factor[] = []
  for (const factor of factors) {
    if (factor.constant === 0) continue
    let handled = false
    for (let i = 0; i < result.length; i++) {
      const c = addFactor(result[i], factor)
      if (c !== undefined) {
        if (c === 0) {
          result.splice(i, 1)
        } else {
          result[i].constant = c
        }
        handled = true
        break
      }
    }
    if (!handled) {
      result.push(factor)
    }
  }
  return result
}

function getCommonDivisor(a: number, b: number): number {
  if (a <= 1 || b <= 1) return 1
  if (a === b) return a
  if (a > b) {
    return getCommonDivisor(a % b, b)
  }
  return getCommonDivisor(a, b % a)
}
