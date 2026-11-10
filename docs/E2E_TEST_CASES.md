# E2E-тесты Telegram-бота

## Юзкейсы покупок — 2026-11-10

Подробные предусловия, шаги, альтернативы и ожидаемое состояние backend:
[PURCHASE_USE_CASES.md](PURCHASE_USE_CASES.md). Краткие CHECKOUT-001…008 из
[TEST_CHECKOUT_CLIENT.md](TEST_CHECKOUT_CLIENT.md) покрываются этими сценариями;
повторный независимый прогон одинаковых шагов не требуется.

| ID | Юзкейс |
| --- | --- |
| UC-PURCHASE-01 | Баланс, операции и однократный подарок |
| UC-PURCHASE-02 | Каталог и окончательная цена заказа |
| UC-PURCHASE-03 | Успешная тестовая покупка TEXT/IMAGE |
| UC-PURCHASE-04 | Возврат без оплаты, отмена, истечение |
| UC-PURCHASE-05 | Повторные клики и сетевые ошибки |
| UC-PURCHASE-06 | Восстановление после перезапуска |
| UC-PURCHASE-07 | Задержанная проверка и зачисление |
| UC-PURCHASE-08 | Изменение каталога и гонка цены |
| UC-PURCHASE-09 | Отключение checkout, allowlist, чужой заказ |
| UC-PURCHASE-10 | Ошибки провайдера и ручная сверка |
| UC-PURCHASE-11 | Повторные и несвоевременные webhook/check |
| UC-PURCHASE-12 | Частичный/полный возврат и долг |
| UC-PURCHASE-13 | RU/EN, навигация и пагинация |
| UC-PURCHASE-14 | Пополнение и явное возобновление генерации |
| UC-PURCHASE-15 | Асинхронное уведомление (ещё не реализовано) |

## Каталог и заказы — 2026-11-10

- BILLING-001: из баланса открыть каталог; сверить цены и количество с backend в RU/EN.
- BILLING-002: пустой каталог/история, переходы страниц по 5 записей, возврат к балансу.
- BILLING-003: история последних заказов и карточка совпадают с backend, включая оплату,
  зачисление, частичный/полный возврат и snapshot цены после изменения каталога.
- BILLING-004: обновление карточки не создаёт платёж и не выдаёт кредиты; нет checkout-ссылок.
- BILLING-005: чужой/удалённый заказ, устаревшие кнопки, ошибка сети и сохранение меню.

## Баланс — 2026-11-10

- BALANCE-001: `/balance`, RU/EN-клавиатура и `menu:balance`; переход отменяет текущий ввод.
- BALANCE-002: остатки TEXT/IMAGE, резервы и долг совпадают с backend; обновление и отсутствие данных.
- BALANCE-003: последние 10 операций, пустая история, локализованные даты и возврат к балансу.
- BALANCE-004: недоступный backend, устаревшие кнопки и сохранение основной клавиатуры.
- BALANCE-005: подписка по-прежнему доступна; покупки не предлагаются.

Документ описывает ручные end-to-end сценарии для production или отдельного тестового контура.
Каждый сценарий выполняется через Telegram-клиент, а результат сверяется с сообщением бота и
состоянием backend. После выполнения результат заносится в `docs/E2E_TEST_STATUS.md`.

## Подготовка

- Для новых платёжных сценариев использовать только изолированный тестовый контур
  по [PURCHASE_USE_CASES.md](PURCHASE_USE_CASES.md). Production не использовать для test checkout.
- Исторические legacy-сценарии ниже проверять на явно выбранной версии и модели тарификации.
- Убедиться, что бот отвечает на `/start`.
- Для сценариев каналов использовать тестовый канал, где бот администратор с правом публикации.
- Для legacy-сценариев изображений/модерации нужен соответствующий тариф; для prepaid —
  включённый на отдельном стенде режим и достаточный TEXT/IMAGE баланс.
- Не использовать личные данные и не публиковать тестовые материалы в чужие каналы.

## Сквозные сценарии

| ID | Раздел | Сценарий | Ожидаемый результат |
| --- | --- | --- | --- |
| E2E-001 | Onboarding | Отправить `/start` новому пользователю | Создан профиль, показано приветствие и основное меню |
| E2E-002 | Navigation | Открыть каждый пункт основного меню | Каждый пункт открывает соответствующую страницу |
| E2E-003 | Navigation | Перейти в другой раздел во время ввода данных | Текущий черновик отменён, новый раздел открыт |
| E2E-004 | Navigation | Скрыть и снова показать reply-клавиатуру | Кнопка Telegram скрывает и возвращает основное меню |
| E2E-005 | Navigation | Отправить `/menu` на любом шаге | Показано основное меню, активный ввод сброшен |
| E2E-006 | Localization | Использовать русский `language_code` | Все UI-тексты отображаются на русском |
| E2E-007 | Localization | Использовать поддерживаемый английский `language_code` | Все UI-тексты отображаются на английском |
| E2E-008 | Channels | Подключить канал через `@username` | Бот проверяет канал и добавляет его в список |
| E2E-009 | Channels | Подключить канал через ссылку `https://t.me/...` | Ссылка нормализуется, канал добавляется |
| E2E-010 | Channels | Ввести группу или неизвестный username | Показана локализованная ошибка, канал не добавлен |
| E2E-011 | Channels | Подключить канал без права публикации | Показана ошибка прав, состояние не создаётся |
| E2E-012 | Channels | Открыть список подключённых каналов | Отображаются название, username и статус каждого канала |
| E2E-013 | Channels | Изменить название канала | Название обновлено, версия состояния актуальна |
| E2E-014 | Channels | Проверить неактивный канал | Backend повторно проверяет канал и возвращает новый статус |
| E2E-015 | Topics | Создать тему с валидными данными | Тема появляется в списке |
| E2E-016 | Topics | Создать тему с пустым названием или prompt | Показана ошибка валидации |
| E2E-017 | Topics | Изменить тему | Изменения отображаются после повторного открытия |
| E2E-018 | Posts | Создать пост без активного канала | Показано требование сначала подключить канал |
| E2E-019 | Posts | Создать пост с каналом, темой и prompt | Создан пост со статусом draft/active согласно backend |
| E2E-020 | Posts | Создать пост без изображения | В запросе `generateImage=false` |
| E2E-021 | Posts | Создать пост с изображением на доступном тарифе | В запросе `generateImage=true`, изображение обрабатывается backend |
| E2E-022 | Posts | Опубликовать пост в AUTO | Создана публикация, генерация и публикация выполняются без модерации |
| E2E-023 | Posts | Опубликовать пост в MODERATION | Публикация ожидает решения модератора |
| E2E-024 | Posts | Открыть список постов и версии | Отображаются посты, версии и статусы |
| E2E-025 | Posts | Архивировать пост | Пост больше нельзя публиковать или планировать |
| E2E-026 | Moderation | Одобрить сгенерированный пост | Пост публикуется, заявка получает approved |
| E2E-027 | Moderation | Отклонить пост | Публикация отменяется, пост не отправляется в канал |
| E2E-028 | Moderation | Запросить исправление с feedback | Создаётся новая версия, лимит revision учитывается |
| E2E-029 | Schedules | Создать одноразовое расписание | Расписание появляется с корректными датой и timezone |
| E2E-030 | Schedules | Дождаться выполнения одноразового расписания | Пост генерируется и публикуется согласно режиму |
| E2E-031 | Schedules | Создать ежедневное повторяющееся расписание | Пользователь выбирает частоту и время; сохраняются `FREQ=DAILY` и корректная следующая дата запуска |
| E2E-032 | Schedules | Создать недельное и месячное повторяющиеся расписания | Для недели сохраняется выбранный день недели, для месяца — число месяца; каждое расписание имеет одну следующую дату запуска |
| E2E-041 | Schedules | Проверить recurring после одного запуска | Следующая дата пересчитана, расписание осталось active и сохраняет исходные локальные время и календарное правило |
| E2E-033 | Schedules | Отменить расписание | Статус cancelled, новые публикации не создаются |
| E2E-034 | Subscription | Открыть «Подписка и лимиты» | Показаны тариф, лимиты и доступность функций |
| E2E-035 | Subscription | Успешно выполнить текстовую генерацию | `TEXT_GENERATION` увеличивается в текущем периоде |
| E2E-036 | Subscription | Выполнить генерацию изображения | `IMAGE_GENERATION` увеличивается при включённой возможности |
| E2E-037 | Subscription | Достичь лимита операции | Backend отклоняет операцию и бот показывает локализованную ошибку |
| E2E-038 | Resilience | Повторить callback или открыть устаревшую страницу | Показана ошибка stale resource, данные не повреждены |
| E2E-039 | Resilience | Имитировать временную ошибку backend | Безопасные GET повторяются, state-changing запрос не дублируется |
| E2E-040 | Errors | Перезапустить бота во время активного flow | Durable-состояние сохраняется backend, временный ввод корректно сбрасывается |

## Критерии завершения

Сценарий считается успешным только после проверки результата в Telegram и, если сценарий меняет
доменное состояние, подтверждения состояния через повторное открытие страницы или backend-данные.
Для публикаций дополнительно проверяется фактическое сообщение в тестовом канале.

## Generation pack migration acceptance — 2026-10-19 (pending)

Prior subscription/monthly-usage and no-image-preview cases document legacy coverage; they are not acceptance criteria for the target billing model. Use [GENERATION_PACKS_PLAN.md](GENERATION_PACKS_PLAN.md) for replacement requirements. Historical PASS/Готово results remain historical.

| Case | Expected behavior | Status |
| --- | --- | --- |
| PACK-001 | Initial text consumes 1 TEXT and grants exactly three included successful revisions | Не проверено |
| PACK-002 | Fourth and later revisions cost 1 TEXT after confirmation; allowance does not reset | Не проверено |
| PACK-003 | Every generated recurring occurrence has its own initial debit and allowance | Не проверено |
| PACK-004 | Every image replacement costs 1 IMAGE; selected preview is reused at publication | Не проверено |
| PACK-005 | Duplicate payment notifications grant credits once; forged/redirect-only confirmation grants none | Не проверено |
| PACK-006 | Concurrent last-credit and last-included-revision requests cannot overspend | Не проверено |
| PACK-007 | Technical failures release reservations; delivery retry does not regenerate or charge again | Не проверено |
| PACK-008 | Purchased balances survive month boundaries; gifts granted once | Не проверено |
| PACK-009 | Insufficient funds blocks the relevant operation; top-up/resume is idempotent | Не проверено |
| PACK-010 | Client views, backend balances and purchase history agree | Не проверено |

## Telegram prepaid client acceptance — 2026-11-10

| Case | Expected behavior | Status |
| --- | --- | --- |
| BOT-PACK-001 | Balance, catalogue and order list/detail show backend-owned data | Не проверено |
| BOT-PACK-002 | Paid text revision shows explicit backend quote; only confirmed quote is submitted | Не проверено |
| BOT-PACK-003 | Image replacement requires explicit 1 IMAGE quote; stale versions fail; every action button stays within Telegram callback_data limit | Не проверено |
| BOT-PACK-004 | Test checkout requires explicit nonproduction flag; default and production expose no purchase action | Не проверено |
