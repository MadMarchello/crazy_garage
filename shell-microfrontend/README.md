# Shell Microfrontend

Минималистичный shell-шаблон на React + TypeScript для микрофронтендов.

## Особенности

- **TypeScript** с максимально строгими настройками (приближенно к C++/Dart)
- **ESLint** с жесткими правилами проверки типов
- Все проверки типов включены на этапе компиляции

## Установка

```bash
npm install
```

## Запуск

Для работы shell-приложения необходимо запустить подключенные микрофронтенды:

1. Запустите test_microfrontend (счетчик):
```bash
cd ../test_microfrontend
npm install
npm run dev
```
Приложение будет доступно на http://localhost:3001

2. Запустите shell-microfrontend:
```bash
npm run dev
```
Приложение будет доступно на http://localhost:3000

Shell-приложение автоматически загрузит подключенные микрофронтенды.

## Проверка типов

```bash
npm run type-check
```

## Линтинг

```bash
npm run lint
```

## Сборка

```bash
npm run build
```

## Предпросмотр production сборки

```bash
npm run preview
```

