const RESET = '\u001B[39m'

export const ansi = {
  red(message: string): string {
    return `\u001B[31m${message}${RESET}`
  },
  cyan(message: string): string {
    return `\u001B[36m${message}${RESET}`
  },
}
