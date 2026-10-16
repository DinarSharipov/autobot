# User-facing text. Keep message IDs and variable names aligned across locales.

channels-connect = Подключить канал
channels-ask-username = Отправьте @username канала или ссылку вида https://t.me/channel.
action-edit-named = Изменить: { $name }
action-archive = Архив
action-verify-named = Проверить: { $name }
action-home = В меню
channels-verified = Канал «{ $title }» проверен: { $status }.
channels-ask-title = Отправьте новое название канала (до 255 символов).
channels-archived = Канал отправлен в архив.
channels-connected = Канал «{ $title }» подключён со статусом { $status }.
channels-open = Открыть каналы
validation-title = Название должно содержать от 1 до 255 символов.
validation-channel-username = Укажите корректный @username или ссылку на канал.
channels-renamed = Название канала изменено на «{ $title }».
channels-heading = Ваши каналы:
channels-empty = Каналов пока нет. Нажмите «Подключить канал» и добавьте бота администратором с правом публикации сообщений.
error-generic = Не удалось обработать запрос. Попробуйте ещё раз.
error-integration = Интеграция с сервисом настраивается. Попробуйте позднее.
error-unavailable = Сервис временно недоступен. Попробуйте позднее.
error-entitlement = Достигнут лимит вашего тарифа.
error-usage = Лимит этой операции по вашему тарифу исчерпан.
error-image-generation-not-included = Генерация изображений недоступна на вашем тарифе.
error-moderation-not-included = Модерация недоступна на вашем тарифе.
error-validation = Проверьте введённые данные и попробуйте ещё раз.
error-channel-inactive = Канал не активен. Проверьте, что бот добавлен администратором канала.
error-channel-unavailable = Telegram не смог получить этот канал. Проверьте, что бот добавлен в канал и имеет права администратора.
error-channel-permissions = Бот добавлен в канал, но не может публиковать сообщения. Выдайте ему право «Публикация сообщений» и повторите попытку.
error-not-channel = Выбранный чат не является каналом. Выберите канал Telegram.
error-channel-linked = Этот канал уже подключён к другому пользователю.
error-post-inactive = Пост больше не активен и не может быть запланирован.
error-date-offset = Дата должна содержать часовой пояс, например +03:00.
error-timezone = Неизвестный часовой пояс.
error-moderation-pending = Текст ещё не готов к модерации. Попробуйте обновить список позже.
error-stale-resource = Данные уже изменились. Откройте раздел заново и повторите действие.
error-schedule-not-editable = Это расписание уже нельзя изменить в текущем состоянии.
error-schedule-not-found = Расписание больше не найдено. Обновите список.
error-post-not-publishable = Пост сейчас нельзя опубликовать.
error-moderation-decided = Эта заявка на модерацию уже обработана.
action-back-home = На главную
action-create-post = Создать пост
action-open-web-admin = Открыть Web Admin
moderation-ask-feedback = Опишите, что изменить в тексте (до 4000 символов).
validation-feedback = Комментарий должен содержать от 1 до 4000 символов.
moderation-revision-requested = Новая версия запрошена. Статус публикации: { $status }.
moderation-empty = Постов, ожидающих модерации, нет.
action-publish = Опубликовать
action-revise = Правка
action-reject = Отклонить
moderation-approved = Пост одобрен. Статус публикации: { $status }.
moderation-rejected = Пост отклонён и публикация отменена.
moderation-text-pending = Текст ещё не готов.
moderation-item =
    Пост на модерации (версия { $version }):
    
    { $text }
navigation-stale-page = Эта страница устарела. Выберите раздел в основном меню.
navigation-cancelled = Текущий сценарий отменён. Выберите раздел в основном меню.
navigation-unknown-command = Неизвестная команда. Выберите раздел в основном меню или используйте /cancel.
action-versions = Версии
action-edit-prompt = Изменить prompt
posts-flow-expired = Сценарий создания поста устарел. Начните заново через /createpost.
posts-ask-prompt = Опишите, какой текст нужно подготовить для публикации.
posts-ask-image = Добавлять изображение к публикации?
action-yes = Да
action-no = Нет
posts-created = Пост создан (версия { $version }). Что сделать дальше?
action-publish-now = Опубликовать сейчас
action-schedule = Запланировать
action-schedule-once = Один раз
action-schedule-recurring = Повторять
posts-publication-started = Публикация запущена. Статус: { $status }.
posts-text-pending = Текст ещё не сгенерирован.
posts-versions-heading =
    История версий:
    
    { $versions }
posts-versions-empty = Версий пока нет.
posts-ask-edit-prompt = Отправьте новый prompt поста (до 20 000 символов).
posts-archived = Пост отправлен в архив.
posts-ask-date = Отправьте дату и время в ISO 8601 с часовым поясом, например 2030-01-15T18:00:00+03:00.
posts-ask-schedule-kind = Выберите тип расписания.
posts-ask-rrule = Отправьте правило повторения в формате RRULE, например FREQ=DAILY;BYHOUR=9;BYMINUTE=0. Поддерживаются DAILY, WEEKLY и MONTHLY.
validation-prompt = Prompt должен содержать от 1 до 20 000 символов.
posts-prompt-updated = Prompt поста обновлён.
validation-post-request = Текст запроса должен содержать от 1 до 20 000 символов.
posts-ask-mode = Выберите режим публикации:
mode-auto = Автоматически
mode-moderation = Через модерацию
validation-date = Укажите корректную дату ISO 8601 с часовым поясом.
validation-date-future = Дата публикации должна быть в будущем.
posts-scheduled = Публикация запланирована на { $date }.
posts-recurring-scheduled = Повторяющееся расписание создано: { $rule }.
validation-rrule = Укажите RRULE с FREQ=DAILY, WEEKLY или MONTHLY. Например: FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=9;BYMINUTE=0.
error-telegram-user = Не удалось определить пользователя Telegram.
posts-channel-required = Сначала добавьте активный канал через раздел «Каналы».
posts-ask-channel = Выберите канал:
posts-no-topic = Без темы
posts-ask-topic = Выберите тему или продолжите без темы:
posts-heading = Ваши посты:
posts-empty = Постов пока нет.
action-pause = Пауза
action-cancel = Отменить
action-resume = Возобновить
schedules-paused = Расписание приостановлено.
schedules-resumed = Расписание возобновлено.
schedules-cancelled = Расписание отменено.
schedules-heading = Ваше расписание:
schedules-empty = Запланированных публикаций нет.
schedules-item = • { $date } — { $status } (пост { $postId })
section-topics = Темы
section-channels = Каналы
section-posts = Посты
section-moderation = Модерация
section-schedules = Расписание
section-subscription = Подписка и лимиты
section-home = Главное меню
usage-unlimited = без ограничений
usage-no-data = нет данных
usage-ratio = { $used } из { $limit }
action-create-topic = Создать тему
topics-ask-name = Введите название темы. Чтобы отменить создание, используйте /cancel.
topics-ask-edit-prompt = Отправьте новую инструкцию темы (до 20 000 символов).
topics-archived = Тема отправлена в архив.
validation-topic-prompt = Инструкция должна содержать от 1 до 20 000 символов.
topics-updated = Инструкция темы «{ $name }» обновлена.
validation-text = Введите текстовое значение.
validation-name-length = Название должно содержать не более 255 символов.
topics-ask-prompt = Теперь отправьте инструкцию для генерации постов по этой теме.
validation-instructions-length = Инструкция должна содержать не более 20 000 символов.
topics-created = Тема «{ $name }» создана.
topics-heading = Ваши темы:
topics-empty = У вас пока нет тем. Создайте первую — она будет содержать инструкцию для генерации постов.
navigation-keyboard-hint = Основное меню доступно на любом шаге. Свернуть или открыть его можно кнопкой клавиатуры рядом с полем ввода. Команда /menu восстанавливает меню.
home-page =
    Autobot — главное меню
    
    Выберите раздел на клавиатуре под полем ввода.
    Из любого шага можно перейти в другой раздел — текущий ввод будет отменён.
start-page =
    Добро пожаловать в Autobot!
    
    Создавайте и планируйте публикации для Telegram-каналов.
    Основное меню доступно на каждом шаге. Выберите раздел на клавиатуре под полем ввода.
subscription-page =
    Тариф: { $plan }
    Статус: { $status }

    Лимит каналов: { $channels }
    Лимит тем: { $topics }
    Генерации текста: { $textUsage }
    Генерации изображений: { $imageUsage }
    Правки на модерации: { $revisionUsage }
    
    Изображения: { $images }
    Модерация: { $moderation }
availability-enabled = доступно
availability-disabled = недоступно
date-unspecified = без даты
channels-item = • { $title }{ $username } — { $status }
posts-item = • { $title } — { $mode }, { $status }
posts-version-item =
    • №{ $version } — { $status }
    { $text }
topics-item = • { $name }
navigation-stale-button = Эта кнопка устарела. Откройте раздел заново.
navigation-fallback = Выберите раздел в основном меню или начните создание поста через /createpost.
status-active = активно
status-archived = в архиве
status-invalid = требует проверки
status-pending = ожидает обработки
status-cancelled = отменено
status-draft = черновик
status-awaiting-moderation = ожидает модерации
status-delivery-unknown = результат доставки неизвестен
status-failed = ошибка
status-generating = генерируется
status-published = опубликовано
status-publishing = публикуется
status-ready = готово
status-retry-wait = ожидает повторной попытки
status-skipped = пропущено
status-approved = одобрено
status-generated = сгенерировано
status-generation-pending = ожидает генерации
status-rejected = отклонено
status-superseded = заменено новой версией
status-revision-requested = запрошена правка
status-completed = завершено
status-paused = приостановлено
status-expired = истекло
status-past-due = просрочена оплата
status-trialing = пробный период
status-unknown = неизвестный статус
