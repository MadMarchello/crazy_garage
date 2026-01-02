import React, { useEffect, useRef, useState } from 'react'
import { microfrontendComm } from '../utils/microfrontendCommunication'
import { MESSAGE_TYPES } from '../constants/messageTypes'

const TestMicrofrontend: React.FC = (): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [countFromMicrofrontend, setCountFromMicrofrontend] = useState<number>(0)
  const [shellCounter, setShellCounter] = useState<number>(0)

  useEffect(() => {
    const loadMicrofrontend = async (): Promise<void> => {
      if (containerRef.current === null) {
        return
      }

      // Проверяем, не добавлен ли уже iframe
      if (containerRef.current.querySelector('iframe') !== null) {
        return
      }

      // Создаем iframe для загрузки микрофронтенда
      const iframe = document.createElement('iframe')
      //TODO: Добавить переменную для URL микрофронтенда и настроить CI/CD
      iframe.src = 'http://localhost:3001'
      iframe.style.width = '100%'
      iframe.style.height = '600px'
      iframe.style.border = 'none'
      iframe.style.borderRadius = '8px'
      iframe.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'

      iframeRef.current = iframe
      microfrontendComm.setIframe(iframe)

      containerRef.current.appendChild(iframe)

      // Ждем загрузки iframe перед отправкой начальных данных
      iframe.onload = () => {
        // Отправляем начальное значение счетчика в микрофронтенд
        microfrontendComm.sendToMicrofrontend(MESSAGE_TYPES.SET_COUNT, shellCounter)
      }
    }

    void loadMicrofrontend()

    // Cleanup функция для удаления iframe при размонтировании
    return () => {
      if (containerRef.current !== null) {
        const iframe = containerRef.current.querySelector('iframe')
        if (iframe !== null && iframe.parentNode !== null) {
          iframe.parentNode.removeChild(iframe)
        }
      }
      iframeRef.current = null
    }
  }, [])

  useEffect(() => {
    // Подписываемся на сообщения от микрофронтенда
    const unsubscribe = microfrontendComm.onMessageFromMicrofrontend(
      MESSAGE_TYPES.COUNT_CHANGED,
      (payload) => {
        if (typeof payload === 'object' && payload !== null && 'count' in payload) {
          setCountFromMicrofrontend(payload.count as number)
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Отправляем обновленное значение счетчика в микрофронтенд
    if (iframeRef.current !== null && iframeRef.current.contentWindow !== null) {
      microfrontendComm.sendToMicrofrontend(MESSAGE_TYPES.SET_COUNT, shellCounter)
    }
  }, [shellCounter])

  const incrementShellCounter = (): void => {
    setShellCounter(shellCounter + 1)
  }

  const decrementShellCounter = (): void => {
    setShellCounter(shellCounter - 1)
  }

  return (
    <div className="microfrontend-container">
      <div className="microfrontend-wrapper">
        <h2 className="microfrontend-title">Тестовый микрофронтенд - Счетчик</h2>
        
        {/* Панель управления из shell */}
        <div className="shell-control-panel">
          <h3>Управление из Shell</h3>
          <div className="shell-counter-display">
            <span>Счетчик Shell: {shellCounter}</span>
          </div>
          <div className="shell-counter-buttons">
            <button onClick={decrementShellCounter} className="shell-button shell-button-decrement">
              - Shell
            </button>
            <button onClick={incrementShellCounter} className="shell-button shell-button-increment">
              + Shell
            </button>
          </div>
        </div>

        {/* Данные из микрофронтенда */}
        <div className="microfrontend-data-panel">
          <h3>Данные из микрофронтенда</h3>
          <div className="microfrontend-data-display">
            <span>Счетчик из микрофронтенда: {countFromMicrofrontend}</span>
          </div>
        </div>

        <div ref={containerRef} className="microfrontend-content" />
      </div>
    </div>
  )
}

export default TestMicrofrontend

