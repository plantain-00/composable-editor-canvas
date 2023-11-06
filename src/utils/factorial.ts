export function factorial(num: number): number {
  for (let i = result.length; i <= num; i++) {
    result.push(i * result[i - 1])
  }
  return result[num]
}

const result: number[] = [1]
