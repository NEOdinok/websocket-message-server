# Mini-Analytics

## Предусловия

| ПО          | Минимальная версия                          |
| ----------- | ------------------------------------------- |
| **Node.js** | 18.18.0 (рекомендовано 20 LTS)              |
| **pnpm**    | 9.0.0                                       |
| **MongoDB** | 6.x (локально или отдалённый Atlas кластер) |

> Версии фиксируются в `package.json` через поле `engines`, поэтому при запуске/установке несовместимых версий вы сразу получите понятное сообщение от `pnpm`.

## Установка и запуск

```bash
# терминал 1
cp .env.example .env # создаем env переменные (при необходимости изменить порты)

pnpm mongo:reset # чистим все инстансы mongo, запускаемся заново

pnpm run dev # запускаем приложение

# терминал 2
npx wscat -c ws://localhost:8080 # запускаем слушатель WebSocket

# Рекоммендуется терминал 3 для HTTP, ручново взаимодействия с Mongo
```

## Сразу пояснение про rs0 флаг

**Почему `replicaSet=rs0` и флаг `--replSet rs0`?**

Change Streams работают **только** в реплика-конфигурации MongoDB.
Даже одиночный (stand-alone) инстанс нужно запустить как реплику.  
Поэтому скрипт `mongo:reset` поднимает Mongo с параметром `--replSet rs0`,
а в `MONGO_URI` добавляется `/?replicaSet=rs0`.

## Тест серверов

### Отправка нового сообщения:

```h
curl -X POST http://localhost:3000/messages \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello"}'

# => {"ok":true}
```

### Чтение сообщений:

```h
curl http://localhost:3000/messages | jq

# увидите массив с одним документом
```

### WebSockets

```h
npx wscat -c ws://localhost:8080

# После POST строкой выше придёт JSON сообщения
```

### Как понять что сервер ничего не теряет

```ts
// После запуска остановить сервер в терминале 1

// Вручную добавить в "терминале 3" 2 документа в ДБ

mongosh --eval '
db = db.getSiblingDB("messagesApp");
db.messages.insertMany([
  { text: "while server down 1", createdAt: new Date() },
  { text: "while server down 2", createdAt: new Date() }
]);
'

// Запустить сервер снова `pnpm dev`

// Увидеть 2 лога
// 💾 CHANGE while server down 1
// 💾 CHANGE while server down 2
```

## Итог:

- Сервер **не теряет** события Mongo между рестартами –- это мы убедились по логам.
- WebSocket-клиент, подключившийся позже, по умолчанию получает **только новые** изменения –- это нормальное поведение согласно ТЗ.
