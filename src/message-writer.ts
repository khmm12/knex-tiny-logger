import type { MessageWriter, MessageWriterTarget } from './types.ts'

export function resolveMessageWriter(write: MessageWriter | MessageWriterTarget = console.log): MessageWriter {
  if (typeof write === 'function') {
    return write
  }

  return (message) => {
    write.write(message)
  }
}
