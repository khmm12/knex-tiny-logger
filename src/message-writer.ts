import type { MessageWriter, MessageWriterTarget } from './types.js'

export function resolveMessageWriter(write: MessageWriter | MessageWriterTarget = console.log): MessageWriter {
  if (typeof write === 'function') {
    return write
  }

  return (message) => {
    write.write(message)
  }
}
