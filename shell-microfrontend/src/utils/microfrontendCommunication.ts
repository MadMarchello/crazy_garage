export interface MicrofrontendMessage {
  type: string
  payload?: unknown
}

export type MessageHandler = (payload: unknown) => void

class MicrofrontendCommunication {
  private iframeRef: HTMLIFrameElement | null = null
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()

  constructor() {
    this.setupMessageListener()
  }

  setIframe(iframe: HTMLIFrameElement): void {
    this.iframeRef = iframe
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent<MicrofrontendMessage>) => {
      // Проверяем источник для безопасности
      //TODO: Добавить переменную для URL микрофронтенда и настроить CI/CD
      if (event.origin !== 'http://localhost:3001') {
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
  }

  sendToMicrofrontend(type: string, payload?: unknown): void {
    if (this.iframeRef === null || this.iframeRef.contentWindow === null) {
      console.warn('Iframe not ready or contentWindow is null')
      return
    }

    const message: MicrofrontendMessage = { type, payload }
    this.iframeRef.contentWindow.postMessage(message, 'http://localhost:3001')
  }

  onMessageFromMicrofrontend(type: string, handler: MessageHandler): () => void {
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

export const microfrontendComm = new MicrofrontendCommunication()

