# Кварта

Лендинг вымышленной обжарки «Кварта» (Next.js, TypeScript, Tailwind). Заявки с формы сохраняются в PostgreSQL на [Neon](https://neon.tech) через `POST /api/lead`.

Требования: `docs/kvarta-brief.pdf`. Журнал работ: `ai-log.md`. Память проекта: `docs/PROJECT_MEMORY.md`.

## Запуск

```bash
npm install
cp .env.example .env.local   # заполнить DATABASE_URL (секрет не коммитить)
npm run db:migrate             # один раз, таблицы заявок
npm run dev                    # разработка, http://localhost:3000
```

Проверки этапа API:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:lead-api
```

## Почему Neon для заявок

- **PostgreSQL** даёт параметризованные запросы, транзакции и `pg_advisory_xact_lock` для дедупликации одного номера в течение 10 минут при параллельных запросах — это требование этапа, а не in-memory или «SELECT затем INSERT» без сериализации.
- **Neon** (serverless Postgres, регион Frankfurt рядом с планируемым Vercel) совпадает с выбранным стеком размещения из брифа; драйвер `@neondatabase/serverless` уже используется в Next.js route handlers через `Pool`.
- Миграция версионируется в `db/migrations/`, применяется отдельной командой, не при каждой сборке или HTTP-запросе.

## Независимый разбор кода (2026-10-15)

**Как обнаружено:** Виктор запросил у Cursor полный текст ключевых файлов этапа `POST /api/lead` и передал их **ChatGPT** на проверку. Перечисленные ниже недостатки выявил разбор ChatGPT; **Виктор их самостоятельно в коде не искал**.

| Недостаток | Исправление | Подтверждение |
|------------|-------------|---------------|
| `scripts/lead-api-check.mjs` дублировал `createLeadInTransaction` и нормализацию телефона | Скрипт заменён на `scripts/lead-api-check.ts`: вызываются `validateLeadInput`, `createLeadInTransaction`, `countLeads`, handler `POST` из `app/api/lead/route.ts`; запуск через `node --experimental-strip-types` и hook `@/` | `npm run test:lead-api` — все пункты OK |
| `sampleLead` давал `+37529` и ещё 9 цифр (лишняя длина) | После `375` ровно 9 цифр: `+37529` + 7 случайных цифр; проверка `sampleLead passes validateLeadInput` | тот же скрипт |
| «invalid input not stored» не вызывала валидацию/отправку | Явный отказ `validateLeadInput`; `POST` с `+375abc` → 400; счётчик `public.leads` не растёт; валидные тесты только в `lead_api_test` | тот же скрипт |
| Пул и `connect()` вне `try` при ошибке подключения | Пул и клиент в `try`, `finally` освобождает только созданное; сбой → JSON 500 | тест с временно неверным `DATABASE_URL` в скрипте |
| Сообщение 409 предлагало «позвонить» без телефона в брифе | Текст без призыва звонить | код `route.ts`; форма показывает ответ сервера |

**Вклад:** **Виктор** — бриф, приёмка, передача фрагментов кода на разбор, `.env.local`, Neon; **Cursor** — реализация лендинга, API, правки по разбору; **ChatGPT** — независимый разбор присланного кода и формулировка замечаний (без доступа к репозиторию и без запуска проверок).

Push, merge и deploy по умолчанию не выполнялись.
