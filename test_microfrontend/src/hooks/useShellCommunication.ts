import { useEffect, useState } from 'react'
import { shellComm, type MessageHandler } from '../utils/shellCommunication'

/**
 * Хук для упрощения работы с коммуникацией shell
 * @param messageType - тип сообщения для подписки
 * @param initialValue - начальное значение
 * @returns текущее значение и функцию для отправки данных
 */
export function useShellCommunication<T>(
  messageType: string,
  initialValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    const unsubscribe = shellComm.onMessageFromShell(messageType, (payload) => {
      setValue(payload as T)
    })

    return () => {
      unsubscribe()
    }
  }, [messageType])

  const sendValue = (newValue: T): void => {
    shellComm.sendToShell(messageType, newValue)
  }

  return [value, sendValue]
}

/**
 * Хук для подписки на сообщения от shell
 * @param messageType - тип сообщения
 * @param handler - обработчик сообщения
 */
export function useShellMessage(messageType: string, handler: MessageHandler): void {
  useEffect(() => {
    const unsubscribe = shellComm.onMessageFromShell(messageType, handler)

    return () => {
      unsubscribe()
    }
  }, [messageType, handler])
}

