/**
 * Типы сообщений для коммуникации со shell
 */
export const MESSAGE_TYPES = {
  // Сообщения от shell к микрофронтенду
  SET_COUNT: 'SET_COUNT',
  SET_CONFIG: 'SET_CONFIG',
  RESET_STATE: 'RESET_STATE',

  // Сообщения от микрофронтенда к shell
  COUNT_CHANGED: 'COUNT_CHANGED',
  STATE_CHANGED: 'STATE_CHANGED',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
} as const

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES]

