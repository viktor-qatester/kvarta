# Память проекта «Кварта»

Краткое состояние на 2026-10-15. Подробности и ошибки — в `ai-log.md`. Как повторять пройденные шаги — в `docs/BUILD_GUIDE.md`.

## Цель и стек

Лендинг вымышленной обжарки «Кварта» с заявкой на подписку или разовый заказ. Источник требований: `docs/kvarta-brief.pdf`.

Стек: Next.js App Router, TypeScript, Tailwind CSS. По проверке каркаса: Node.js v26.7.0, npm 11.19.0, Next.js 16.4.1. Имя пакета: `kvarta`.

## Git

Ветка: `feat/lead-api` (от `feat/landing-ui`). Remote, push, merge и deploy не выполнялись.

Коммиты (ветка `feat/landing-ui` и далее):

- `1c255da` на `main` — бриф, правила, журнал и `.gitignore`.
- `f9c0cb2` на `feat/initial-setup` — каркас Next.js и стартовая страница.
- `5282ee9` на `feat/landing-ui` — адаптивный лендинг.
- `91c5009` на `feat/landing-ui` — документация, `.env.example`, Neon-драйвер, полноразмерные скриншоты.

На `feat/lead-api` после этапа API — отдельный коммит (см. `git log`).

## Интерфейс

Сверстаны шапка с якорями, первый экран, расписание, ассортимент, подписка, история Ани и Дмитрия, доставка и самовывоз, форма заявки. Телефон, почта и соцсети не добавлялись.

Форма отправляет `POST /api/lead`: состояние «Отправляем…», успех после 201, дубликат 409, ошибки полей 400, сбой сети с сохранением введённых данных. UTM и URL входа фиксируются при первом открытии вкладки (`sessionStorage`).

Отложено: заменить фото первого экрана `public/images/hero-kitchen.jpg` (338×304).

## Данные

Размещение: Vercel + Neon Postgres. Vercel не подключался.

Neon: проект `kvarta`, регион Frankfurt, план Free.

`DATABASE_URL` в `.env.local` (игнорируется Git). Шаблон: `.env.example`.

Таблицы (миграция `db/migrations/001_leads.sql`):

- `leads` — заявки (имя, нормализованный телефон, интерес, комментарий, товар, UTM, landing_url).
- `lead_dedup` — `phone_normalized`, `last_accepted_at` для окна 10 минут.

Дедупликация: одна транзакция на заявку — advisory lock по телефону, `FOR UPDATE` на строку dedup, проверка времени, INSERT lead + UPSERT dedup только при успехе.

API: только `POST /api/lead`. Публичного просмотра заявок нет.

## Следующий этап

GitHub remote, push, Vercel, Lighthouse, финальный README для сдачи.
