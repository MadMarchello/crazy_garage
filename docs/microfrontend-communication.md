# Система коммуникации между Shell и микрофронтендами

## Обзор

Реализована система обмена данными между shell-приложением и микрофронтендами через `postMessage` API. Это позволяет:

- Отправлять данные из shell в микрофронтенд
- Получать данные из микрофронтенда в shell
- Синхронизировать состояние между приложениями

## Архитектура

### Shell → Microfrontend

Shell-приложение может отправлять сообщения в микрофронтенд через `microfrontendComm.sendToMicrofrontend()`.

### Microfrontend → Shell

Микрофронтенд может отправлять сообщения в shell через `shellComm.sendToShell()`.

## Использование в Shell

### Базовое использование

```typescript
import { microfrontendComm } from '../utils/microfrontendCommunication'

// Отправка данных в микрофронтенд
microfrontendComm.sendToMicrofrontend('SET_COUNT', 42)

// Подписка на сообщения от микрофронтенда
const unsubscribe = microfrontendComm.onMessageFromMicrofrontend(
  'COUNT_CHANGED',
  (payload) => {
    console.log('Получено от микрофронтенда:', payload)
  }
)

// Не забудьте отписаться при размонтировании
unsubscribe()
```

### Использование хука

```typescript
import { useMicrofrontendMessage } from '../hooks/useMicrofrontendCommunication'

function MyComponent() {
  const [count, setCount] = useState(0)

  useMicrofrontendMessage('COUNT_CHANGED', (payload) => {
    if (typeof payload === 'object' && payload !== null && 'count' in payload) {
      setCount(payload.count as number)
    }
  })

  const sendToMicrofrontend = () => {
    microfrontendComm.sendToMicrofrontend('SET_COUNT', count)
  }

  return <div>...</div>
}
```

## Использование в микрофронтенде

### Базовое использование

```typescript
import { shellComm } from './utils/shellCommunication'

// Отправка данных в shell
shellComm.sendToShell('COUNT_CHANGED', { count: 42 })

// Подписка на сообщения от shell
const unsubscribe = shellComm.onMessageFromShell('SET_COUNT', (payload) => {
  console.log('Получено от shell:', payload)
})

// Не забудьте отписаться при размонтировании
unsubscribe()
```

### Использование хука

```typescript
import { useShellMessage } from './hooks/useShellCommunication'

function MyComponent() {
  const [count, setCount] = useState(0)

  useShellMessage('SET_COUNT', (payload) => {
    if (typeof payload === 'number') {
      setCount(payload)
    }
  })

  const sendToShell = () => {
    shellComm.sendToShell('COUNT_CHANGED', { count })
  }

  return <div>...</div>
}
```

## Типы сообщений

Рекомендуется использовать константы для типов сообщений:

```typescript
// В shell
export const MESSAGE_TYPES = {
  SET_COUNT: 'SET_COUNT',
  COUNT_CHANGED: 'COUNT_CHANGED',
} as const

// В микрофронтенде
export const MESSAGE_TYPES = {
  SET_COUNT: 'SET_COUNT',
  COUNT_CHANGED: 'COUNT_CHANGED',
} as const
```

## Безопасность

Система проверяет источник сообщений для безопасности:
- Shell принимает сообщения только от `http://localhost:3001`
- Microfrontend принимает сообщения только от `http://localhost:3000`

В production необходимо обновить эти значения на реальные домены.

## Примеры использования

### Синхронизация счетчика

**Shell:**
```typescript
const [shellCount, setShellCount] = useState(0)

useMicrofrontendMessage('COUNT_CHANGED', (payload) => {
  if (typeof payload === 'object' && payload !== null && 'count' in payload) {
    setShellCount(payload.count as number)
  }
})

const updateMicrofrontend = () => {
  microfrontendComm.sendToMicrofrontend('SET_COUNT', shellCount)
}
```

**Microfrontend:**
```typescript
const [count, setCount] = useState(0)

useShellMessage('SET_COUNT', (payload) => {
  if (typeof payload === 'number') {
    setCount(payload)
  }
})

const updateCount = (newCount: number) => {
  setCount(newCount)
  shellComm.sendToShell('COUNT_CHANGED', { count: newCount })
}
```

## Лучшие практики

1. **Используйте TypeScript типы** для payload сообщений
2. **Проверяйте типы данных** перед использованием
3. **Отписывайтесь от сообщений** при размонтировании компонентов
4. **Используйте константы** для типов сообщений
5. **Обрабатывайте ошибки** при отправке сообщений

