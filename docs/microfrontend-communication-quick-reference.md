# Краткий справочник: Коммуникация микрофронтендов

## Быстрый старт

### Отправка события из Shell в Microfrontend

```typescript
import { microfrontendComm } from './utils/microfrontendCommunication';
import { MESSAGE_TYPES } from './constants/messageTypes';

// Отправить событие
microfrontendComm.sendToMicrofrontend(MESSAGE_TYPES.SET_COUNT, 42);
```

### Подписка на события от Microfrontend в Shell

```typescript
useEffect(() => {
  const unsubscribe = microfrontendComm.onMessageFromMicrofrontend(
    MESSAGE_TYPES.COUNT_CHANGED,
    (payload) => {
      if (payload && typeof payload === 'object' && 'count' in payload) {
        setCount(payload.count as number);
      }
    }
  );
  
  return () => unsubscribe();
}, []);
```

### Отправка события из Microfrontend в Shell

```typescript
import { shellComm } from './utils/shellCommunication';
import { MESSAGE_TYPES } from './constants/messageTypes';

// Отправить событие
shellComm.sendToShell(MESSAGE_TYPES.COUNT_CHANGED, { count: 43 });
```

### Подписка на события от Shell в Microfrontend

```typescript
useEffect(() => {
  const unsubscribe = shellComm.onMessageFromShell(
    MESSAGE_TYPES.SET_COUNT,
    (payload) => {
      if (typeof payload === 'number') {
        setCount(payload);
      }
    }
  );
  
  return () => unsubscribe();
}, []);
```

## Типы сообщений

| Тип | Направление | Payload | Описание |
|-----|-------------|---------|----------|
| `SET_COUNT` | Shell → MF | `number` | Установить значение счетчика |
| `COUNT_CHANGED` | MF → Shell | `{ count: number }` | Счетчик изменился |
| `SET_CONFIG` | Shell → MF | `Config` | Передать конфигурацию |
| `RESET_STATE` | Shell → MF | `null` | Сбросить состояние |
| `ERROR_OCCURRED` | MF → Shell | `{ error: string, code?: string }` | Произошла ошибка |
| `READY` | MF → Shell | `null` | Микрофронтенд готов |

## Структура события

```typescript
interface Event {
  type: string;        // Тип события
  payload?: unknown;   // Данные события
}
```

## Безопасность

### Проверка источника (автоматически)

- Shell принимает только от `http://localhost:3001`
- Microfrontend принимает только от `http://localhost:3000`

### Валидация данных (рекомендуется)

```typescript
// Всегда проверяйте структуру payload
if (typeof payload === 'object' && payload !== null && 'count' in payload) {
  const count = payload.count as number;
  // Использовать count
}
```

## Best Practices

### ✅ DO

- Используйте константы для типов событий
- Всегда валидируйте payload
- Отписывайтесь от событий при размонтировании
- Используйте TypeScript типы
- Логируйте события в dev режиме

### ❌ DON'T

- Не отправляйте чувствительные данные
- Не забывайте отписываться от событий
- Не игнорируйте проверку origin
- Не используйте строковые литералы вместо констант
- Не обрабатывайте события без валидации

## Отладка

### Включить логирование

```typescript
// В dev режиме события логируются автоматически
// Проверьте консоль браузера
```

### Проверить подписки

```typescript
// Добавьте console.log в обработчики
microfrontendComm.onMessageFromMicrofrontend('COUNT_CHANGED', (payload) => {
  console.log('Received:', payload);
  // обработка
});
```

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| События не доставляются | Проверьте origin в настройках |
| Двойной рендеринг | Проверьте cleanup в useEffect |
| События дублируются | Убедитесь, что подписка только одна |
| Payload undefined | Добавьте валидацию перед использованием |

## Связанные документы

- [Детальная архитектура](./microfrontend-event-architecture.md)
- [Диаграммы](./microfrontend-event-diagrams.md)
- [Руководство по использованию](./microfrontend-communication.md)

