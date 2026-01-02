# Архитектура коммуникации микрофронтендов через события (Event-Driven Architecture)

## 1. Введение

### 1.1. Назначение документа

Данный документ описывает архитектурную концепцию обмена данными между микрофронтендами на основе событийной модели (Event-Driven Architecture). Документ предназначен для разработчиков, архитекторов и системных аналитиков, работающих с микрофронтенд-архитектурой.

### 1.2. Область применения

Документация охватывает:
- Концептуальную модель событийной коммуникации
- Протокол обмена сообщениями между shell-приложением и микрофронтендами
- Механизмы безопасности и валидации
- Паттерны использования и best practices
- Масштабируемость и расширяемость системы

### 1.3. Терминология

| Термин | Определение |
|--------|-------------|
| **Shell Application** | Основное приложение-контейнер, которое загружает и координирует микрофронтенды |
| **Microfrontend** | Независимое фронтенд-приложение, работающее в изолированном контексте (iframe) |
| **Event** | Событие - структурированное сообщение, передаваемое между компонентами системы |
| **Event Bus** | Централизованный механизм маршрутизации событий |
| **Message Handler** | Обработчик события, функция-подписчик на определенный тип события |
| **Payload** | Полезная нагрузка события - данные, передаваемые вместе с событием |
| **PostMessage API** | Браузерный API для безопасной межоконной коммуникации |

---

## 2. Архитектурная концепция

### 2.1. Общая архитектура

Система построена на принципах **Event-Driven Architecture (EDA)** с использованием паттерна **Publisher-Subscriber (Pub/Sub)**.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Shell Application                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Event Bus (MicrofrontendComm)                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │  Publisher   │  │  Subscriber  │  │   Router     │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           │ PostMessage API                      │
│                           │                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    iframe Container                      │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │          Microfrontend Application                 │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │         Event Bus (ShellComm)                 │  │  │  │
│  │  │  │  ┌──────────────┐  ┌──────────────┐         │  │  │  │
│  │  │  │  │  Publisher   │  │  Subscriber  │         │  │  │  │
│  │  │  │  └──────────────┘  └──────────────┘         │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. Принципы проектирования

#### 2.2.1. Разделение ответственности (Separation of Concerns)
- **Shell** отвечает за координацию и маршрутизацию событий
- **Microfrontend** отвечает за свою бизнес-логику и генерацию событий
- **Event Bus** отвечает за доставку и маршрутизацию сообщений

#### 2.2.2. Слабая связанность (Loose Coupling)
- Компоненты не знают о внутренней реализации друг друга
- Коммуникация происходит только через стандартизированные события
- Изменения в одном микрофронтенде не влияют на другие

#### 2.2.3. Высокая связность (High Cohesion)
- Все компоненты Event Bus сгруппированы по функциональности
- Обработчики событий логически связаны с бизнес-процессами

#### 2.2.4. Масштабируемость (Scalability)
- Легко добавлять новые микрофронтенды
- Поддержка множественных подписчиков на одно событие
- Возможность расширения типов событий без изменения базовой архитектуры

---

## 3. Модель событий

### 3.1. Структура события

Каждое событие представляет собой структурированный объект со следующей схемой:

```typescript
interface Event {
  type: string;        // Тип события (идентификатор)
  payload?: unknown;   // Полезная нагрузка (данные события)
  timestamp?: number;  // Временная метка (опционально)
  source?: string;     // Источник события (опционально)
  target?: string;     // Целевой получатель (опционально)
}
```

### 3.2. Типы событий

#### 3.2.1. Классификация по направлению

**Shell → Microfrontend:**
- `SET_COUNT` - установка значения счетчика
- `SET_CONFIG` - передача конфигурации
- `RESET_STATE` - сброс состояния
- `NAVIGATE` - навигация (для SPA)
- `UPDATE_THEME` - обновление темы оформления

**Microfrontend → Shell:**
- `COUNT_CHANGED` - изменение счетчика
- `STATE_CHANGED` - изменение состояния
- `ERROR_OCCURRED` - ошибка в микрофронтенде
- `READY` - микрофронтенд готов к работе
- `USER_ACTION` - действие пользователя

#### 3.2.2. Классификация по назначению

| Категория | Описание | Примеры |
|-----------|----------|---------|
| **State Events** | События изменения состояния | `COUNT_CHANGED`, `STATE_CHANGED` |
| **Command Events** | Команды для выполнения действий | `SET_COUNT`, `RESET_STATE` |
| **Query Events** | Запросы данных | `GET_STATE`, `GET_CONFIG` |
| **System Events** | Системные события | `READY`, `ERROR_OCCURRED` |
| **User Events** | События пользовательских действий | `USER_ACTION`, `BUTTON_CLICKED` |

### 3.3. Схема данных (Data Schema)

#### 3.3.1. Примеры payload для различных событий

```typescript
// SET_COUNT
{
  type: "SET_COUNT",
  payload: 42  // number
}

// COUNT_CHANGED
{
  type: "COUNT_CHANGED",
  payload: {
    count: 42,
    previousCount: 41,
    timestamp: 1234567890
  }
}

// SET_CONFIG
{
  type: "SET_CONFIG",
  payload: {
    theme: "dark",
    language: "ru",
    features: ["feature1", "feature2"]
  }
}

// ERROR_OCCURRED
{
  type: "ERROR_OCCURRED",
  payload: {
    error: "Error message",
    code: "ERR_001",
    stack?: "Error stack trace",
    context?: { /* additional context */ }
  }
}
```

---

## 4. Протокол коммуникации

### 4.1. Механизм передачи сообщений

1Система использует **PostMessage API** - стандартный браузерный механизм для безопасной межоконной коммуникации.

#### 4.1.1. Отправка сообщения (Shell → Microfrontend)

```typescript
// Псевдокод
iframe.contentWindow.postMessage(
  { type: "SET_COUNT", payload: 42 },
  "http://localhost:3001"  // targetOrigin для безопасности
)
```

#### 4.1.2. Отправка сообщения (Microfrontend → Shell)

```typescript
// Псевдокод
window.parent.postMessage(
  { type: "COUNT_CHANGED", payload: { count: 42 } },
  "http://localhost:3000"  // targetOrigin для безопасности
)
```

#### 4.1.3. Прием сообщения

```typescript
// Псевдокод
window.addEventListener('message', (event: MessageEvent) => {
  // Проверка источника
  if (event.origin !== expectedOrigin) {
    return;  // Игнорируем сообщения из недоверенных источников
  }
  
  // Обработка события
  const { type, payload } = event.data;
  handleEvent(type, payload);
});
```

### 4.2. Жизненный цикл события

```
┌─────────────┐
│  Publisher  │
│  (Отправитель)│
└──────┬──────┘
       │
       │ 1. Создание события
       │    { type, payload }
       │
       ▼
┌─────────────────┐
│  Event Bus      │
│  (Маршрутизатор)│
└──────┬──────────┘
       │
       │ 2. Валидация источника
       │ 3. Поиск подписчиков
       │
       ▼
┌─────────────────┐
│  PostMessage    │
│  API            │
└──────┬──────────┘
       │
       │ 4. Передача через iframe boundary
       │
       ▼
┌─────────────────┐
│  Event Bus      │
│  (Получатель)   │
└──────┬──────────┘
       │
       │ 5. Валидация получателя
       │ 6. Маршрутизация к подписчикам
       │
       ▼
┌─────────────┐
│ Subscribers │
│ (Подписчики)│
└─────────────┘
```

### 4.3. Последовательность взаимодействия

#### 4.3.1. Инициализация микрофронтенда

```
Shell                    Microfrontend
  │                           │
  │─── Load iframe ──────────>│
  │                           │
  │                           │─── Initialize ──┐
  │                           │                 │
  │<─── READY event ───────────│                 │
  │                           │                 │
  │─── SET_CONFIG ───────────>│                 │
  │                           │                 │
  │                           │<─── Ready ──────┘
```

#### 4.3.2. Обмен данными

```
Shell                    Microfrontend
  │                           │
  │─── SET_COUNT(42) ────────>│
  │                           │─── Update state ──┐
  │                           │                    │
  │<─── COUNT_CHANGED(43) ────│<─── User action ───┘
  │                           │
  │─── Update UI ────────────┐│
  │                           │
```

---

## 5. Детали реализации

### 5.1. Event Bus в Shell (MicrofrontendCommunication)

#### 5.1.1. Архитектура класса

```typescript
class MicrofrontendCommunication {
  // Хранилище iframe ссылок
  private iframeRef: HTMLIFrameElement | null
  
  // Реестр обработчиков событий
  // Map<EventType, Set<Handler>>
  private messageHandlers: Map<string, Set<MessageHandler>>
  
  // Методы:
  // - setIframe() - регистрация iframe
  // - sendToMicrofrontend() - отправка события
  // - onMessageFromMicrofrontend() - подписка на события
  // - setupMessageListener() - инициализация слушателя
}
```

#### 5.1.2. Алгоритм работы

1. **Инициализация:**
   - Создание экземпляра класса
   - Регистрация глобального слушателя `window.addEventListener('message')`
   - Инициализация пустого реестра обработчиков

2. **Регистрация iframe:**
   - Shell передает ссылку на iframe через `setIframe()`
   - Сохранение ссылки для последующей отправки сообщений

3. **Отправка события:**
   - Валидация наличия iframe и contentWindow
   - Создание объекта события `{ type, payload }`
   - Вызов `postMessage()` с указанием targetOrigin

4. **Подписка на события:**
   - Регистрация обработчика в реестре по типу события
   - Возврат функции отписки для cleanup

5. **Обработка входящих событий:**
   - Проверка origin для безопасности
   - Поиск обработчиков по типу события
   - Вызов всех зарегистрированных обработчиков

### 5.2. Event Bus в Microfrontend (ShellCommunication)

#### 5.2.1. Архитектура класса

```typescript
class ShellCommunication {
  // Реестр обработчиков событий
  private messageHandlers: Map<string, Set<MessageHandler>>
  
  // Флаг инициализации (защита от повторной инициализации)
  private isInitialized: boolean
  
  // Методы:
  // - sendToShell() - отправка события в shell
  // - onMessageFromShell() - подписка на события от shell
  // - setupMessageListener() - инициализация слушателя
}
```

#### 5.2.2. Отличия от Shell Event Bus

- Не требует регистрации iframe (использует `window.parent`)
- Имеет защиту от повторной инициализации
- Работает в изолированном контексте iframe

### 5.3. Паттерн подписки (Subscription Pattern)

#### 5.3.1. Множественные подписчики

Система поддерживает множественные подписчики на одно событие:

```typescript
// Подписчик 1
microfrontendComm.onMessageFromMicrofrontend('COUNT_CHANGED', (payload) => {
  updateCounter(payload);
});

// Подписчик 2
microfrontendComm.onMessageFromMicrofrontend('COUNT_CHANGED', (payload) => {
  logEvent(payload);
});

// Подписчик 3
microfrontendComm.onMessageFromMicrofrontend('COUNT_CHANGED', (payload) => {
  sendAnalytics(payload);
});
```

При получении события `COUNT_CHANGED` все три обработчика будут вызваны последовательно.

#### 5.3.2. Управление подписками

```typescript
// Подписка возвращает функцию отписки
const unsubscribe = microfrontendComm.onMessageFromMicrofrontend(
  'COUNT_CHANGED',
  handler
);

// Отписка при размонтировании компонента
useEffect(() => {
  return () => {
    unsubscribe();  // Cleanup
  };
}, []);
```

---

## 6. Безопасность

### 6.1. Валидация источника (Origin Validation)

#### 6.1.1. Принцип

Все входящие сообщения проверяются на соответствие ожидаемому источнику (origin).

```typescript
// В Shell
if (event.origin !== 'http://localhost:3001') {
  return;  // Игнорируем сообщения из недоверенных источников
}

// В Microfrontend
if (event.origin !== 'http://localhost:3000') {
  return;  // Игнорируем сообщения из недоверенных источников
}
```

#### 6.1.2. Рекомендации для production

1. **Использование переменных окружения:**
   ```typescript
   const ALLOWED_ORIGINS = process.env.ALLOWED_MICROFRONTEND_ORIGINS?.split(',') || [];
   ```

2. **Whitelist подход:**
   ```typescript
   const ALLOWED_ORIGINS = [
     'https://microfrontend1.example.com',
     'https://microfrontend2.example.com'
   ];
   
   if (!ALLOWED_ORIGINS.includes(event.origin)) {
     return;
   }
   ```

3. **Динамическая конфигурация:**
   - Загрузка списка разрешенных источников из конфигурационного файла
   - Обновление whitelist без пересборки приложения

### 6.2. Валидация данных (Data Validation)

#### 6.2.1. Проверка структуры события

```typescript
function isValidEvent(event: MessageEvent): boolean {
  if (!event.data || typeof event.data !== 'object') {
    return false;
  }
  
  if (!event.data.type || typeof event.data.type !== 'string') {
    return false;
  }
  
  return true;
}
```

#### 6.2.2. Валидация payload

Рекомендуется использовать схемы валидации (например, Zod, Yup):

```typescript
import { z } from 'zod';

const CountChangedSchema = z.object({
  count: z.number().int().min(0),
  previousCount: z.number().int().min(0).optional(),
  timestamp: z.number().optional()
});

function handleCountChanged(payload: unknown) {
  const result = CountChangedSchema.safeParse(payload);
  
  if (!result.success) {
    console.error('Invalid payload:', result.error);
    return;
  }
  
  // Использование валидированных данных
  const { count } = result.data;
  // ...
}
```

### 6.3. Защита от XSS

#### 6.3.1. Санитизация данных

- Все данные от микрофронтендов должны рассматриваться как потенциально опасные
- Использование библиотек санитизации (DOMPurify) при отображении HTML
- Избежание использования `innerHTML` с недоверенными данными

#### 6.3.2. Content Security Policy (CSP)

Рекомендуется настроить CSP заголовки:

```
Content-Security-Policy: 
  default-src 'self';
  frame-src 'self' http://localhost:3001;
  script-src 'self' 'unsafe-inline';
```

### 6.4. Rate Limiting

Для защиты от перегрузки системы рекомендуется реализовать rate limiting:

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number = 100;
  private windowMs: number = 60000; // 1 minute
  
  isAllowed(source: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(source) || [];
    
    // Удаляем старые запросы
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(source, recentRequests);
    return true;
  }
}
```

---

## 7. Масштабируемость и расширяемость

### 7.1. Поддержка множественных микрофронтендов

#### 7.1.1. Реестр микрофронтендов

```typescript
class MicrofrontendRegistry {
  private microfrontends: Map<string, HTMLIFrameElement> = new Map();
  
  register(id: string, iframe: HTMLIFrameElement): void {
    this.microfrontends.set(id, iframe);
  }
  
  sendToMicrofrontend(id: string, type: string, payload?: unknown): void {
    const iframe = this.microfrontends.get(id);
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type, payload },
        this.getOrigin(id)
      );
    }
  }
  
  broadcast(type: string, payload?: unknown): void {
    this.microfrontends.forEach((iframe, id) => {
      this.sendToMicrofrontend(id, type, payload);
    });
  }
}
```

#### 7.1.2. Маршрутизация событий

```typescript
// Отправка события конкретному микрофронтенду
microfrontendRegistry.sendToMicrofrontend('counter-mf', 'SET_COUNT', 42);

// Broadcast события всем микрофронтендам
microfrontendRegistry.broadcast('UPDATE_THEME', { theme: 'dark' });
```

### 7.2. Middleware для событий

#### 7.2.1. Концепция

Middleware позволяет перехватывать и модифицировать события на этапе передачи:

```typescript
type Middleware = (
  event: Event,
  next: (event: Event) => void
) => void;

class EventBusWithMiddleware {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }
  
  private processEvent(event: Event): void {
    let index = 0;
    
    const next = (event: Event) => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        middleware(event, next);
      } else {
        this.dispatchEvent(event);
      }
    };
    
    next(event);
  }
}
```

#### 7.2.2. Примеры middleware

```typescript
// Логирование
const loggingMiddleware: Middleware = (event, next) => {
  console.log(`[Event] ${event.type}`, event.payload);
  next(event);
};

// Валидация
const validationMiddleware: Middleware = (event, next) => {
  if (validateEvent(event)) {
    next(event);
  } else {
    console.error('Invalid event:', event);
  }
};

// Трансформация
const transformMiddleware: Middleware = (event, next) => {
  const transformedEvent = {
    ...event,
    payload: transformPayload(event.payload)
  };
  next(transformedEvent);
};
```

### 7.3. Event Versioning

Для поддержки версионирования событий:

```typescript
interface VersionedEvent {
  type: string;
  version: string;  // "1.0", "2.0", etc.
  payload: unknown;
}

class EventVersionManager {
  private handlers: Map<string, Map<string, Handler>> = new Map();
  
  on(eventType: string, version: string, handler: Handler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }
    this.handlers.get(eventType)!.set(version, handler);
  }
  
  handle(event: VersionedEvent): void {
    const versionHandlers = this.handlers.get(event.type);
    if (versionHandlers) {
      const handler = versionHandlers.get(event.version);
      if (handler) {
        handler(event.payload);
      } else {
        // Fallback на последнюю версию или обработка ошибки
      }
    }
  }
}
```

---

## 8. Паттерны использования

### 8.1. Синхронизация состояния

#### 8.1.1. Односторонняя синхронизация (Shell → Microfrontend)

```typescript
// Shell
const [globalCount, setGlobalCount] = useState(0);

useEffect(() => {
  microfrontendComm.sendToMicrofrontend('SET_COUNT', globalCount);
}, [globalCount]);

// Microfrontend
useEffect(() => {
  const unsubscribe = shellComm.onMessageFromShell('SET_COUNT', (payload) => {
    if (typeof payload === 'number') {
      setCount(payload);
    }
  });
  return unsubscribe;
}, []);
```

#### 8.1.2. Двусторонняя синхронизация

```typescript
// Shell
const [shellCount, setShellCount] = useState(0);
const [mfCount, setMfCount] = useState(0);

// Отправка в микрофронтенд
useEffect(() => {
  microfrontendComm.sendToMicrofrontend('SET_COUNT', shellCount);
}, [shellCount]);

// Получение от микрофронтенда
useEffect(() => {
  const unsubscribe = microfrontendComm.onMessageFromMicrofrontend(
    'COUNT_CHANGED',
    (payload) => {
      if (payload && typeof payload === 'object' && 'count' in payload) {
        setMfCount(payload.count as number);
      }
    }
  );
  return unsubscribe;
}, []);
```

### 8.2. Команды и запросы (Command-Query Pattern)

#### 8.2.1. Команда (Command)

```typescript
// Shell отправляет команду
microfrontendComm.sendToMicrofrontend('RESET_STATE', null);

// Microfrontend выполняет команду
shellComm.onMessageFromShell('RESET_STATE', () => {
  setCount(0);
  setState(initialState);
});
```

#### 8.2.2. Запрос-ответ (Request-Response)

```typescript
// Shell отправляет запрос
const requestId = generateId();
microfrontendComm.sendToMicrofrontend('GET_STATE', { requestId });

// Microfrontend отвечает
shellComm.onMessageFromShell('GET_STATE', (payload) => {
  if (payload && typeof payload === 'object' && 'requestId' in payload) {
    shellComm.sendToShell('GET_STATE_RESPONSE', {
      requestId: payload.requestId,
      state: currentState
    });
  }
});

// Shell получает ответ
microfrontendComm.onMessageFromMicrofrontend('GET_STATE_RESPONSE', (payload) => {
  if (payload.requestId === requestId) {
    setState(payload.state);
  }
});
```

### 8.3. Event Sourcing (опционально)

Для сложных сценариев можно реализовать Event Sourcing:

```typescript
interface EventStore {
  events: Event[];
  append(event: Event): void;
  replay(handler: (event: Event) => void): void;
}

class EventSourcedState {
  private store: EventStore;
  
  applyEvent(event: Event): void {
    this.store.append(event);
    this.handleEvent(event);
  }
  
  replay(): void {
    this.store.replay((event) => this.handleEvent(event));
  }
}
```

---

## 9. Мониторинг и отладка

### 9.1. Логирование событий

#### 9.1.1. Dev режим

```typescript
class EventLogger {
  private isDev: boolean = process.env.NODE_ENV === 'development';
  
  log(event: Event, direction: 'outbound' | 'inbound'): void {
    if (this.isDev) {
      console.log(`[Event ${direction}]`, {
        type: event.type,
        payload: event.payload,
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

#### 9.1.2. Production мониторинг

```typescript
class EventMonitor {
  sendToAnalytics(event: Event): void {
    if (window.analytics) {
      window.analytics.track('microfrontend_event', {
        event_type: event.type,
        payload_size: JSON.stringify(event.payload).length,
        timestamp: Date.now()
      });
    }
  }
}
```

### 9.2. Инструменты разработчика

#### 9.2.1. Event Inspector

```typescript
// DevTools расширение для просмотра событий
class EventInspector {
  private events: Event[] = [];
  
  record(event: Event): void {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });
    
    // Ограничение размера истории
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }
  
  getHistory(): Event[] {
    return [...this.events];
  }
  
  clear(): void {
    this.events = [];
  }
}
```

---

## 10. Best Practices

### 10.1. Проектирование событий

1. **Используйте осмысленные имена:**
   - ✅ `COUNT_CHANGED` вместо `CC`
   - ✅ `USER_LOGIN_SUCCESS` вместо `ULS`

2. **Группируйте связанные события:**
   - `COUNT_*` - все события счетчика
   - `USER_*` - все события пользователя
   - `SYSTEM_*` - системные события

3. **Документируйте payload:**
   ```typescript
   /**
    * Событие изменения счетчика
    * @payload { count: number, previousCount?: number, timestamp?: number }
    */
   export const COUNT_CHANGED = 'COUNT_CHANGED';
   ```

### 10.2. Обработка ошибок

```typescript
// Всегда обрабатывайте ошибки
microfrontendComm.onMessageFromMicrofrontend('COUNT_CHANGED', (payload) => {
  try {
    if (typeof payload === 'object' && payload !== null && 'count' in payload) {
      setCount(payload.count as number);
    } else {
      throw new Error('Invalid payload structure');
    }
  } catch (error) {
    console.error('Error handling COUNT_CHANGED:', error);
    // Отправка ошибки обратно или в систему мониторинга
    sendErrorToMonitoring(error);
  }
});
```

### 10.3. Производительность

1. **Дебаунсинг частых событий:**
   ```typescript
   const debouncedHandler = debounce((payload) => {
     handleEvent(payload);
   }, 300);
   ```

2. **Throttling:**
   ```typescript
   const throttledHandler = throttle((payload) => {
     handleEvent(payload);
   }, 1000);
   ```

3. **Мемоизация обработчиков:**
   ```typescript
   const handler = useMemo(
     () => (payload: unknown) => {
       // обработка
     },
     [dependencies]
   );
   ```

### 10.4. Тестирование

```typescript
describe('MicrofrontendCommunication', () => {
  it('should send event to microfrontend', () => {
    const iframe = createMockIframe();
    microfrontendComm.setIframe(iframe);
    
    microfrontendComm.sendToMicrofrontend('SET_COUNT', 42);
    
    expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
      { type: 'SET_COUNT', payload: 42 },
      'http://localhost:3001'
    );
  });
  
  it('should handle incoming events', () => {
    const handler = jest.fn();
    microfrontendComm.onMessageFromMicrofrontend('COUNT_CHANGED', handler);
    
    // Симуляция входящего события
    window.dispatchEvent(new MessageEvent('message', {
      origin: 'http://localhost:3001',
      data: { type: 'COUNT_CHANGED', payload: { count: 42 } }
    }));
    
    expect(handler).toHaveBeenCalledWith({ count: 42 });
  });
});
```

---

## 11. Ограничения и известные проблемы

### 11.1. Ограничения PostMessage API

1. **Размер сообщения:** Ограничен размером стека браузера (обычно ~10MB)
2. **Производительность:** Большое количество сообщений может замедлить работу
3. **Синхронность:** PostMessage асинхронный, нет гарантии порядка доставки

### 11.2. Изоляция iframe

1. **Стили:** Стили не наследуются через границы iframe
2. **JavaScript контекст:** Полная изоляция, нет доступа к глобальным переменным
3. **Cookies:** Зависит от настроек SameSite

### 11.3. Решения проблем

1. **Большие данные:** Использование индексации или разделение на части
2. **Порядок доставки:** Использование sequence numbers или timestamps
3. **Производительность:** Батчинг событий, debouncing, throttling

---

## 12. Roadmap и будущие улучшения

### 12.1. Планируемые функции

1. **Event Persistence:** Сохранение событий в localStorage для восстановления состояния
2. **Event Replay:** Возможность воспроизведения событий для отладки
3. **Event Compression:** Сжатие больших payload
4. **TypeScript типизация:** Строгая типизация всех событий через discriminated unions
5. **GraphQL для событий:** Использование GraphQL subscriptions для событий

### 12.2. Альтернативные подходы

1. **Shared Workers:** Для более сложных сценариев
2. **Broadcast Channel API:** Для коммуникации между вкладками
3. **Custom Events:** Для коммуникации в рамках одного окна
4. **Module Federation:** Для более тесной интеграции (Webpack 5)

---

## 13. Заключение

Архитектура событийной коммуникации микрофронтендов обеспечивает:

- ✅ **Гибкость:** Легко добавлять новые микрофронтенды и события
- ✅ **Изоляцию:** Каждый микрофронтенд работает независимо
- ✅ **Масштабируемость:** Поддержка множественных подписчиков и микрофронтендов
- ✅ **Безопасность:** Валидация источников и данных
- ✅ **Отладку:** Логирование и мониторинг событий

Данная архитектура подходит для проектов, требующих:
- Независимую разработку и деплой микрофронтендов
- Использование разных технологий в разных частях приложения
- Гибкую интеграцию сторонних компонентов

---

## Приложения

### Приложение A: Глоссарий

- **Event Bus** - Централизованный механизм маршрутизации событий
- **Payload** - Полезная нагрузка события
- **Publisher** - Отправитель события
- **Subscriber** - Подписчик на события
- **Target Origin** - Ожидаемый источник сообщения для безопасности

### Приложение B: Ссылки

- [MDN: Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Micro Frontends](https://micro-frontends.org/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

---

**Версия документа:** 1.0  
**Дата создания:** 2024  
**Автор:** System Analyst  
**Статус:** Актуальный

