import { useEffect, useState } from 'react'
import { microfrontendComm, type MessageHandler } from '../utils/microfrontendCommunication'

/**
 * Хук для упрощения работы с коммуникацией микрофронтенда
 * @param messageType - тип сообщения для подписки
 * @param initialValue - начальное значение
 * @returns текущее значение и функцию для отправки данных
 */
export function useMicrofrontendCommunication<T>(
  messageType: string,
  initialValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    const unsubscribe = microfrontendComm.onMessageFromMicrofrontend(
      messageType,
      (payload) => {
        setValue(payload as T)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [messageType])

  const sendValue = (newValue: T): void => {
    microfrontendComm.sendToMicrofrontend(messageType, newValue)
  }

  return [value, sendValue]
}

/**
 * Хук для подписки на сообщения от микрофронтенда
 * @param messageType - тип сообщения
 * @param handler - обработчик сообщения
 */
export function useMicrofrontendMessage(
  messageType: string,
  handler: MessageHandler
): void {
  useEffect(() => {
    const unsubscribe = microfrontendComm.onMessageFromMicrofrontend(
      messageType,
      handler
    )

    return () => {
      unsubscribe()
    }
  }, [messageType, handler])
}

