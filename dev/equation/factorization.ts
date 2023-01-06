import { Expression2 } from "expression-engine"

interface Factor {
  constant?: number
  variables: string[]
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

function divideFactors(f1: Factor[], f2: Factor[]): Factor[] | void {
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

function substractFactors(f1: Factor[], f2: Factor[]): Factor[] {
  const result = [...f1]
  for (const f of f2) {
    let handled = false
    for (let i = 0; i < result.length; i++) {
      const r = result[i]
      const e = divideFactor(r, f)
      if (e && e.variables.length === 0) {
        const constant = (r.constant ?? 1) - (f.constant ?? 1)
        if (constant === 0) {
          result.splice(i, 1)
        } else {
          result[i] = {
            constant: constant === 1 ? undefined : constant,
            variables: [...f.variables],
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
    const index = variables.indexOf(v)
    if (index < 0) return
    variables.splice(index, 1)
  }
  const constant = (f1.constant ?? 1) / (f2.constant ?? 1)
  return {
    variables,
    constant: constant === 1 ? undefined : constant,
  }
}

function expressionToFactors(e: Expression2): Factor[] | void {
  if (e.type === 'BinaryExpression' && e.operator === '+') {
    const left = expressionToFactors(e.left)
    if (!left) return
    const right = expressionToFactors(e.right)
    if (!right) return
    return [...left, ...right]
  }
  const factor = expressionToFactor(e)
  if (factor) {
    return [factor]
  }
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
  if (e.type === 'BinaryExpression') {
    if (e.operator === '*') {
      const left = expressionToFactor(e.left)
      if (!left) return
      const right = expressionToFactor(e.right)
      if (!right) return
      return multiplyFactor(left, right)
    }
    if (e.operator === '**') {
      const left = expressionToFactor(e.left)
      if (!left) return
      if (e.right.type !== 'NumericLiteral') return
      if (!Number.isInteger(e.right.value)) return
      if (e.right.value < 1) return
      let constant = 1
      const variables: string[] = []
      for (let i = 0; i < e.right.value; i++) {
        if (left.constant !== undefined) {
          constant *= left.constant
        }
        variables.push(...left.variables)
      }
      return {
        variables,
        constant,
      }
    }
  }
}

function factorsToExpression(f: Factor[]): Expression2 {
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

function factorToExpression(f: Factor): Expression2 {
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
    return {
      type: 'Identifier',
      name: f.variables[0],
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

function multiplyFactor(...factors: Factor[]): Factor {
  let constant = 1
  const variables: string[] = []
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
