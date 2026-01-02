import React, { useState, useEffect } from 'react'
import { shellComm } from './utils/shellCommunication'
import { MESSAGE_TYPES } from './constants/messageTypes'
import './index.css'

export const Counter: React.FC = (): React.JSX.Element => {
  const [count, setCount] = useState<number>(0)
  const [shellCount, setShellCount] = useState<number>(0)

  useEffect(() => {
    // Подписываемся на сообщения от shell
    const unsubscribe = shellComm.onMessageFromShell(MESSAGE_TYPES.SET_COUNT, (payload) => {
      if (typeof payload === 'number') {
        setShellCount(payload)
        // Можно синхронизировать локальный счетчик с shell
        // setCount(payload)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const increment = (): void => {
    const newCount = count + 1
    setCount(newCount)
    // Отправляем обновление в shell
    shellComm.sendToShell(MESSAGE_TYPES.COUNT_CHANGED, { count: newCount })
  }

  const decrement = (): void => {
    const newCount = count - 1
    setCount(newCount)
    // Отправляем обновление в shell
    shellComm.sendToShell(MESSAGE_TYPES.COUNT_CHANGED, { count: newCount })
  }

  const reset = (): void => {
    setCount(0)
    // Отправляем обновление в shell
    shellComm.sendToShell(MESSAGE_TYPES.COUNT_CHANGED, { count: 0 })
  }

  return (
    <div className="counter-container">
      <h2>Счетчик</h2>
      
      {/* Отображение данных из shell */}
      <div className="shell-data-display">
        <span>Данные из Shell: {shellCount}</span>
      </div>

      <div className="counter-display">
        <span className="counter-value">{count}</span>
      </div>
      <div className="counter-buttons">
        <button onClick={decrement} className="counter-button counter-button-decrement">
          -
        </button>
        <button onClick={reset} className="counter-button counter-button-reset">
          Сброс
        </button>
        <button onClick={increment} className="counter-button counter-button-increment">
          +
        </button>
      </div>
    </div>
  )
}

export default Counter

