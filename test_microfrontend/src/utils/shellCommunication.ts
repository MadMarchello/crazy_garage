export interface ShellMessage {
  type: string
  payload?: unknown
}

export type MessageHandler = (payload: unknown) => void

class ShellCommunication {
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private isInitialized = false

  constructor() {
    this.setupMessageListener()
  }

  private setupMessageListener(): void {
    if (this.isInitialized) {
      return
    }

    window.addEventListener('message', (event: MessageEvent<ShellMessage>) => {
      // Проверяем источник для безопасности
      if (event.origin !== 'http://localhost:3000') {
        return
      }

      const { type, payload } = event.data

      if (type !== undefined && this.messageHandlers.has(type)) {
        const handlers = this.messageHandlers.get(type)
        if (handlers !== undefined) {
          handlers.forEach((handler) => {
            handler(payload)
          })
        }
      }
    })

    this.isInitialized = true
  }

  sendToShell(type: string, payload?: unknown): void {
    if (window.parent === null) {
      console.warn('No parent window available')
      return
    }

    const message: ShellMessage = { type, payload }
    window.parent.postMessage(message, 'http://localhost:3000')
  }

  onMessageFromShell(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }

    const handlers = this.messageHandlers.get(type)
    if (handlers !== undefined) {
      handlers.add(handler)
    }

    // Возвращаем функцию для отписки
    return () => {
      const handlers = this.messageHandlers.get(type)
      if (handlers !== undefined) {
        handlers.delete(handler)
      }
    }
  }
}

export const shellComm = new ShellCommunication()

