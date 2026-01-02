# Диаграммы архитектуры коммуникации микрофронтендов

## 1. Общая архитектура системы

```mermaid
graph TB
    subgraph Shell["Shell Application"]
        EB1[Event Bus<br/>MicrofrontendComm]
        UI1[Shell UI Components]
        IF[iframe Container]
    end
    
    subgraph MF["Microfrontend Application"]
        EB2[Event Bus<br/>ShellComm]
        UI2[Microfrontend UI Components]
    end
    
    UI1 -->|Send Event| EB1
    EB1 -->|PostMessage| IF
    IF -->|PostMessage| EB2
    EB2 -->|Handle Event| UI2
    
    UI2 -->|Send Event| EB2
    EB2 -->|PostMessage| IF
    IF -->|PostMessage| EB1
    EB1 -->|Handle Event| UI1
```

## 2. Последовательность инициализации

```mermaid
sequenceDiagram
    participant Shell
    participant IF as iframe
    participant MF as Microfrontend
    
    Shell->>IF: Create iframe element
    Shell->>IF: Set src = microfrontend URL
    IF->>MF: Load application
    MF->>MF: Initialize ShellComm
    MF->>Shell: READY event
    Shell->>MF: SET_CONFIG event
    MF->>MF: Apply configuration
    MF->>Shell: CONFIG_APPLIED event
```

## 3. Обмен событиями (двусторонняя коммуникация)

```mermaid
sequenceDiagram
    participant Shell
    participant EB1 as Shell Event Bus
    participant IF as iframe
    participant EB2 as MF Event Bus
    participant MF as Microfrontend
    
    Shell->>EB1: sendToMicrofrontend('SET_COUNT', 42)
    EB1->>EB1: Validate iframe
    EB1->>IF: postMessage({type, payload}, origin)
    IF->>EB2: MessageEvent received
    EB2->>EB2: Validate origin
    EB2->>EB2: Find subscribers
    EB2->>MF: Call handlers
    
    MF->>MF: User action: increment
    MF->>EB2: sendToShell('COUNT_CHANGED', {count: 43})
    EB2->>IF: postMessage({type, payload}, origin)
    IF->>EB1: MessageEvent received
    EB1->>EB1: Validate origin
    EB1->>EB1: Find subscribers
    EB1->>Shell: Call handlers
    Shell->>Shell: Update UI
```

## 4. Структура Event Bus

```mermaid
classDiagram
    class MicrofrontendCommunication {
        -iframeRef: HTMLIFrameElement
        -messageHandlers: Map~string, Set~Handler~~
        +setIframe(iframe)
        +sendToMicrofrontend(type, payload)
        +onMessageFromMicrofrontend(type, handler)
        -setupMessageListener()
    }
    
    class ShellCommunication {
        -messageHandlers: Map~string, Set~Handler~~
        -isInitialized: boolean
        +sendToShell(type, payload)
        +onMessageFromShell(type, handler)
        -setupMessageListener()
    }
    
    class Event {
        +type: string
        +payload: unknown
        +timestamp?: number
        +source?: string
    }
    
    MicrofrontendCommunication --> Event : sends
    ShellCommunication --> Event : sends
    Event --> MicrofrontendCommunication : received by
    Event --> ShellCommunication : received by
```

## 5. Жизненный цикл события

```mermaid
stateDiagram-v2
    [*] --> Created: Publisher creates event
    Created --> Validated: Event Bus validates
    Validated --> Routed: Find subscribers
    Routed --> Queued: Add to message queue
    Queued --> Sent: PostMessage API
    Sent --> Received: Cross iframe boundary
    Received --> ValidatedTarget: Validate origin
    ValidatedTarget --> RoutedTarget: Find handlers
    RoutedTarget --> Processed: Execute handlers
    Processed --> [*]: Complete
```

## 6. Паттерн подписки (Pub/Sub)

```mermaid
graph LR
    subgraph Publisher["Publisher"]
        E1[Event: COUNT_CHANGED]
    end
    
    subgraph EventBus["Event Bus"]
        R[Router]
        H1[Handler 1]
        H2[Handler 2]
        H3[Handler 3]
    end
    
    E1 -->|Route| R
    R -->|Dispatch| H1
    R -->|Dispatch| H2
    R -->|Dispatch| H3
    
    H1 -->|Update Counter| UI1[UI Component 1]
    H2 -->|Log Event| UI2[Logger]
    H3 -->|Analytics| UI3[Analytics]
```

## 7. Множественные микрофронтенды

```mermaid
graph TB
    subgraph Shell["Shell Application"]
        EB[Event Bus]
        R[Microfrontend Registry]
    end
    
    subgraph MF1["Microfrontend 1"]
        EB1[Event Bus 1]
    end
    
    subgraph MF2["Microfrontend 2"]
        EB2[Event Bus 2]
    end
    
    subgraph MF3["Microfrontend 3"]
        EB3[Event Bus 3]
    end
    
    EB -->|Broadcast| R
    R -->|Send| EB1
    R -->|Send| EB2
    R -->|Send| EB3
    
    EB1 -->|Send| EB
    EB2 -->|Send| EB
    EB3 -->|Send| EB
```

## 8. Безопасность: валидация источника

```mermaid
flowchart TD
    Start[Message Received] --> CheckOrigin{Check Origin}
    CheckOrigin -->|Origin matches| CheckType{Check Event Type}
    CheckOrigin -->|Origin mismatch| Reject[Reject Message]
    CheckType -->|Type exists| CheckPayload{Validate Payload}
    CheckType -->|Type unknown| Ignore[Ignore Message]
    CheckPayload -->|Valid| Process[Process Event]
    CheckPayload -->|Invalid| LogError[Log Error]
    Process --> Execute[Execute Handlers]
    Execute --> End[Complete]
    Reject --> End
    Ignore --> End
    LogError --> End
```

## 9. Middleware цепочка

```mermaid
graph LR
    E[Event] --> M1[Middleware 1<br/>Logging]
    M1 --> M2[Middleware 2<br/>Validation]
    M2 --> M3[Middleware 3<br/>Transformation]
    M3 --> M4[Middleware 4<br/>Rate Limiting]
    M4 --> H[Handler]
    H --> R[Response]
```

## 10. Синхронизация состояния

```mermaid
stateDiagram-v2
    [*] --> ShellState: Shell has state
    ShellState --> SendEvent: State changed
    SendEvent --> MFReceive: Microfrontend receives
    MFReceive --> MFState: Update MF state
    MFState --> UserAction: User interacts
    UserAction --> MFStateChange: MF state changes
    MFStateChange --> SendBack: Send event back
    SendBack --> ShellReceive: Shell receives
    ShellReceive --> ShellState: Update Shell state
    ShellState --> [*]: Synchronized
```

## 11. Обработка ошибок

```mermaid
flowchart TD
    Start[Event Processing] --> Try{Try Process}
    Try -->|Success| Validate{Validate Result}
    Try -->|Error| Catch[Catch Error]
    Validate -->|Valid| Success[Success Handler]
    Validate -->|Invalid| Log[Log Warning]
    Catch --> ErrorEvent[Create ERROR_OCCURRED event]
    ErrorEvent --> SendError[Send to Shell]
    SendError --> Monitor[Send to Monitoring]
    Log --> Continue[Continue Processing]
    Success --> End[Complete]
    Monitor --> End
    Continue --> End
```

## 12. Архитектура масштабирования

```mermaid
graph TB
    subgraph Layer1["Presentation Layer"]
        UI1[Shell UI]
        UI2[MF1 UI]
        UI3[MF2 UI]
    end
    
    subgraph Layer2["Communication Layer"]
        EB1[Shell Event Bus]
        EB2[MF1 Event Bus]
        EB3[MF2 Event Bus]
    end
    
    subgraph Layer3["Transport Layer"]
        PM[PostMessage API]
    end
    
    subgraph Layer4["Business Logic Layer"]
        BL1[Shell Logic]
        BL2[MF1 Logic]
        BL3[MF2 Logic]
    end
    
    UI1 --> EB1
    UI2 --> EB2
    UI3 --> EB3
    EB1 --> PM
    EB2 --> PM
    EB3 --> PM
    PM --> EB1
    PM --> EB2
    PM --> EB3
    EB1 --> BL1
    EB2 --> BL2
    EB3 --> BL3
```

---

**Примечание:** Эти диаграммы можно отрендерить в любом Markdown-редакторе с поддержкой Mermaid (GitHub, GitLab, VS Code с расширением Mermaid, и т.д.)

