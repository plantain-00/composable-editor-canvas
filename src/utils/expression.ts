import { Expression2, ExpressionError, SpreadElement2, parseExpression, priorizedBinaryOperators, tokenizeExpression } from "expression-engine";
import { isLetter, isNumber } from "./text";

export function validateExpression(text: string): [number, number] | undefined {
  try {
    parseExpression(tokenizeExpression(text))
  } catch (error) {
    if (error instanceof ExpressionError) {
      return error.range
    }
  }
  return
}

export function mathStyleExpressionToExpression(e: string) {
  let result = '';
  for (let i = 0; i < e.length; i++) {
    if (e[i] === ' ' && e[i - 1] === ' ') continue;
    result += e[i];
  }
  e = result;
  result = '';
  for (let i = 0; i < e.length; i++) {
    const c = e[i];
    if (c === ' ' && i > 0 && i < e.length - 1) {
      if ((isLetter(e[i - 1]) || isNumber(e[i - 1]) || e[i - 1] === ')') && (isLetter(e[i + 1]) || isNumber(e[i + 1]) || e[i + 1] === '(')) {
        result += '*';
        continue;
      }
    }
    if (c === '^') {
      result += '**';
      continue;
    }
    if (c === '(' && i > 0 && mathFunctions.every(m => !result.endsWith(m))) {
      if (isLetter(e[i - 1]) || isNumber(e[i - 1]) || e[i - 1] === ')') {
        result += '*(';
        continue;
      }
    }
    if (c === ')' && i < e.length - 1) {
      if (isLetter(e[i + 1]) || isNumber(e[i + 1])) {
        result += ')*';
        continue;
      }
    }
    result += c;
  }
  return result;
}

export const mathFunctions = ['sin', 'cos', 'tan']

export function printMathStyleExpression(e: Expression2) {
  const print = (expression: Expression2 | SpreadElement2<Expression2>, priority = Number.MAX_SAFE_INTEGER): string => {
    if (expression.type === 'NumericLiteral') {
      return expression.value.toString();
    }
    if (expression.type === 'Identifier') {
      return expression.name;
    }
    if (expression.type === 'UnaryExpression') {
      const argument = print(expression.argument, -1);
      return `(${expression.operator + argument})`;
    }
    if (expression.type === 'BinaryExpression') {
      const index = priorizedBinaryOperators.findIndex(p => p.includes(expression.operator));
      const rightIndex = expression.operator === '+' || expression.operator === '*' ? index : index - 0.1;
      const operator = expression.operator === '*' ? ' ' : expression.operator === '**' ? '^' : ' ' + expression.operator + ' ';
      const left = print(expression.left, index);
      const right = print(expression.right, rightIndex);
      const result = left === '-1' && operator == ' ' ? '-' + right : left + operator + right;
      if (index > priority) {
        return `(${result})`;
      }
      return result;
    }
    if (expression.type === 'CallExpression') {
      return print(expression.callee) + '(' + expression.arguments.map((a) => print(a)).join(', ') + ')';
    }
    return '';
  };
  return print(e);
}
