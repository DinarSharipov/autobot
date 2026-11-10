# User-facing text. Keep message IDs and variable names aligned across locales.
section-balance = Balance
checkout-select = Select: { $summary }
checkout-packs-page =
    Test catalogue · page { $page }

    { $items }

    Test payments only. Select a pack, then review the created order price.
checkout-open = Continue test purchase
checkout-check = Check payment
checkout-recover = Recover payment link
checkout-start = Confirm price and create test payment
checkout-link = Open test payment
checkout-fulfilled = The service confirms the pack was credited. Open Balance to see current balances.
checkout-refunded-full = Full refund: { $amount }. Credits revoked: { $units }. Check Balance for current credits and debt.
checkout-refunded-partial = Partial refund: { $amount }. Credits revoked: { $units }. Check Balance for current credits and debt.
checkout-link-unavailable = The payment link is unavailable or invalid. Recover the link or check the same payment status.
error-backend-response = The service returned an invalid response. Retry for the same order or open order history instead of creating another purchase.
checkout-awaiting-grant = Payment confirmed; crediting is still pending. Check again later.
checkout-terminal = Payment ended without crediting. See the order card for details.
checkout-review = Review the pack and final order price before creating a test payment.
checkout-pending = Payment is not confirmed yet. Returning from the payment page does not confirm crediting.
checkout-order =
    Test order { $id }
    { $type }: { $units } generations — { $price }

    { $message }
checkout-disabled = Test purchases are disabled. Order history is available under Balance.
checkout-stale = The catalogue changed. Open it again. If you already created an order, check order history first.
checkout-retry = Retry the same request
error-checkout-not-allowed = Test payment is unavailable for this account.
error-checkout-disabled = Test payment is disabled on the server.
error-payment-provider = The payment service result could not be verified. Retry for the same order instead of creating another one.
error-payment-reconciliation = This payment needs support review. Do not create a duplicate order.
error-payment-verification = Payment verification failed. Crediting is not confirmed; contact support.
error-payment-not-confirmed = Payment has not been created or this order cannot be paid. Refresh the order card.
error-pack-unavailable = This pack is no longer available. Refresh the catalogue.
billing-catalogue = Pack catalogue
billing-refresh-order = Refresh order
billing-orders = Order history
billing-previous = Previous
billing-next = Next
billing-empty = Nothing here yet.
billing-pack = { $type }: { $units } generations — { $price }
billing-packs-page =
    Pack catalogue · page { $page }

    { $items }

    Purchases are not available yet.
billing-orders-page =
    Latest orders (up to 100) · page { $page }

    { $items }
billing-open-order = Order { $id }
billing-order-summary =
    { $summary } · { $date }
    Payment: { $payment }; credit grant: { $fulfillment }
billing-order-page =
    Order { $id }
    Created: { $date }
    { $type }: { $units } generations — { $price }
    Order: { $status }
    Payment: { $payment }
    Credit grant: { $fulfillment }
    Refund: { $refund }
    Money refunded: { $refunded }; credits revoked: { $refundedUnits }
billing-pending = pending
billing-awaiting-payment = awaiting payment
billing-paid = paid
billing-not-created = payment not created
billing-succeeded = succeeded
billing-fulfilled = credited
billing-refund-none = none
billing-refund-partial = partial
billing-refund-full = full
error-order-not-found = Order not found or unavailable. Refresh order history.
balance-text = TEXT
balance-image = IMAGE
balance-wallet =
    { $type }: available { $available }
    Reserved: { $reserved }; debt: { $debt }
balance-missing = { $type }: no data
balance-page =
    Generation balance

    { $wallets }

    Existing limits apply until the transition is complete. Purchases are not available yet.
balance-refresh = Refresh balance
balance-history-action = Operation history
balance-history =
    Latest operations (up to 10):

    { $entries }
balance-history-empty = No operations yet.
balance-history-item =
    { $date } — { $kind }
    { $type }: { $units }
balance-kind-gift = Gift
balance-kind-purchase = Purchase
balance-kind-reserve = Reservation
balance-kind-commit = Reservation spent
balance-kind-release = Reservation released
balance-kind-refund = Refund: credits revoked
balance-kind-adjustment = Adjustment
balance-kind-unknown = Operation

channels-connect = Connect channel
channels-ask-username = Send the channel @username or a link such as https://t.me/channel.
action-edit-named = Edit: { $name }
action-archive = Archive
action-verify-named = Verify: { $name }
action-home = Main menu
channels-verified = Channel “{ $title }” verified: { $status }.
channels-ask-title = Send the new channel title (up to 255 characters).
channels-archived = Channel archived.
channels-connected = Channel “{ $title }” connected with status { $status }.
channels-open = Open channels
validation-title = The title must contain between 1 and 255 characters.
validation-channel-username = Enter a valid @username or channel link.
channels-renamed = Channel title changed to “{ $title }”.
channels-heading = Your channels:
channels-empty = No channels yet. Tap “Connect channel” and add the bot as an administrator with permission to post messages.
error-generic = Unable to process the request. Please try again.
error-integration = Service integration is being configured. Please try again later.
error-unavailable = The service is temporarily unavailable. Please try again later.
error-entitlement = Your plan limit has been reached.
error-usage = You have used up your plan allowance for this operation.
error-image-generation-not-included = Image generation is not included in your plan.
error-moderation-not-included = Moderation is not included in your plan.
error-validation = Check your input and try again.
error-channel-inactive = The channel is inactive. Make sure the bot is a channel administrator.
error-channel-unavailable = Telegram could not access this channel. Make sure the bot has been added as an administrator.
error-channel-permissions = The bot cannot publish to this channel. Grant it permission to post messages and try again.
error-not-channel = The selected chat is not a channel. Choose a Telegram channel.
error-channel-linked = This channel is already linked to another user.
error-post-inactive = This post is no longer active and cannot be scheduled.
error-date-offset = The date must include a time zone offset, such as +03:00.
error-timezone = Unknown time zone.
error-moderation-pending = The text is not ready for moderation. Refresh the list later.
error-stale-resource = The data has changed. Reopen the section and try again.
error-cost-confirmation-required = Review the cost and confirm it before continuing.
error-insufficient-text-credits = There are not enough TEXT credits for this action. Top up your balance and try again.
error-insufficient-image-credits = There are not enough IMAGE credits for this image. Top up your balance and try again.
error-media-generation-in-progress = This image is already being generated. Wait for it to finish, then refresh the list.
error-media-outdated = This image was generated for an earlier text version. Refresh and select a current image.
error-media-unavailable = This image is unavailable. Refresh the list and select another one.
error-media-not-mutable = Images for this publication cannot be changed right now.
error-media-not-found = This image could not be found. Refresh the list.
error-media-not-resumable = This image generation cannot be resumed. Refresh the list.
error-media-upload-unknown = The image upload could not be confirmed. Refresh the list before retrying.
error-schedule-not-editable = This schedule cannot be changed in its current state.
error-schedule-not-found = The schedule could not be found. Refresh the list.
error-post-not-publishable = This post cannot be published right now.
error-moderation-decided = This moderation request has already been processed.
action-back-home = Back to home
action-create-post = Create post
action-open-web-admin = Open Web Admin
moderation-ask-feedback = Describe the changes you want (up to 4,000 characters).
moderation-paid-cost = This revision costs { $units } TEXT. Available: { $available }. Confirm before sending your feedback.
moderation-included-cost = This revision is included. Included revisions remaining: { $included }.
moderation-continue = Continue
moderation-images = Images
moderation-media-page = Images: { $count }; selected: { $selected }. A replacement costs 1 IMAGE.
moderation-no-image = none selected
moderation-select-image = Select image ({ $status })
moderation-image-selected = selected
moderation-image-ready = ready
moderation-image-pending = processing
moderation-image-blocked = insufficient IMAGE
moderation-generate-image = Generate replacement — 1 IMAGE
moderation-image-cost = Generating or replacing an image costs { $units } IMAGE. Available: { $available }. Confirm the charge.
moderation-confirm-image = Confirm 1 IMAGE
moderation-image-requested = Image generation started. The preview will appear in Telegram when ready.
moderation-image-selected-result = Image selected for publication.
validation-feedback = The feedback must contain between 1 and 4,000 characters.
moderation-revision-requested = New version requested. Publication status: { $status }.
moderation-empty = No posts awaiting moderation.
action-publish = Publish
action-revise = Request changes
action-reject = Reject
moderation-approved = Post approved. Publication status: { $status }.
moderation-rejected = Post rejected and publication cancelled.
moderation-text-pending = The text is not ready yet.
moderation-item =
    Post awaiting moderation (version { $version }):
    
    { $text }
navigation-stale-page = This page has expired. Choose a section in the main menu.
navigation-cancelled = Current flow cancelled. Choose a section in the main menu.
navigation-unknown-command = Unknown command. Choose a section in the main menu or use /cancel.
action-versions = Versions
action-edit-prompt = Edit prompt
posts-flow-expired = The post creation flow has expired. Start again with /createpost.
posts-ask-prompt = Describe the text you want to prepare for publication.
posts-ask-image = Include an image in this post?
action-yes = Yes
action-no = No
posts-created = Post created (version { $version }). What would you like to do next?
action-publish-now = Publish now
action-schedule = Schedule
action-schedule-once = One time
action-schedule-recurring = Repeat
posts-publication-started = Publication started. Status: { $status }.
posts-text-pending = The text has not been generated yet.
posts-versions-heading =
    Version history:
    
    { $versions }
posts-versions-empty = No versions yet.
posts-ask-edit-prompt = Send the new post prompt (up to 20,000 characters).
posts-archived = Post archived.
posts-ask-date = Send the date and time in ISO 8601 format with a time zone offset, for example 2030-01-15T18:00:00+03:00.
posts-ask-schedule-kind = Choose the schedule type.
posts-ask-frequency = How often should this publication repeat?
frequency-daily = Every day
frequency-weekly = Every week
frequency-monthly = Every month
posts-ask-weekday = On which day of the week should it be published?
posts-ask-monthday = On which day of the month should it be published?
weekday-0 = Sun
weekday-1 = Mon
weekday-2 = Tue
weekday-3 = Wed
weekday-4 = Thu
weekday-5 = Fri
weekday-6 = Sat
posts-ask-time = What time should it be published? Send the time as HH:MM, for example 09:00.
validation-prompt = The prompt must contain between 1 and 20,000 characters.
posts-prompt-updated = Post prompt updated.
validation-post-request = The request must contain between 1 and 20,000 characters.
posts-ask-mode = Choose the publication mode:
mode-auto = Automatic
mode-moderation = With moderation
validation-date = Enter a valid ISO 8601 date with a time zone offset.
validation-date-future = The publication date must be in the future.
posts-scheduled = Publication scheduled for { $date }.
posts-recurring-scheduled = Recurring publication configured: { $frequency } at { $time }.
validation-time = Send a time as HH:MM, for example 09:00.
error-telegram-user = Unable to identify the Telegram user.
posts-channel-required = First add an active channel in the Channels section.
posts-ask-channel = Choose a channel:
posts-no-topic = No topic
posts-ask-topic = Choose a topic or continue without one:
posts-heading = Your posts:
posts-empty = No posts yet.
action-pause = Pause
action-cancel = Cancel
action-resume = Resume
schedules-paused = Schedule paused.
schedules-resumed = Schedule resumed.
schedules-cancelled = Schedule cancelled.
schedules-heading = Your schedules:
schedules-empty = No scheduled publications.
schedules-item = • { $date } — { $status } (post { $postId })
section-topics = Topics
section-channels = Channels
section-posts = Posts
section-moderation = Moderation
section-schedules = Schedules
section-subscription = Plan and usage
section-home = Main menu
usage-unlimited = unlimited
usage-no-data = no data
usage-ratio = { $used } of { $limit }
action-create-topic = Create topic
topics-ask-name = Enter the topic name. Use /cancel to cancel creation.
topics-ask-edit-prompt = Send the new topic instructions (up to 20,000 characters).
topics-archived = Topic archived.
validation-topic-prompt = The instructions must contain between 1 and 20,000 characters.
topics-updated = Instructions for “{ $name }” updated.
validation-text = Enter a text value.
validation-name-length = The name must contain no more than 255 characters.
topics-ask-prompt = Now send instructions for generating posts about this topic.
validation-instructions-length = The instructions must contain no more than 20,000 characters.
topics-created = Topic “{ $name }” created.
topics-heading = Your topics:
topics-empty = No topics yet. Create your first topic to define post generation instructions.
navigation-keyboard-hint = The main menu is available at every step. Use the keyboard icon next to the input field to hide or show it. Use /menu to restore the menu.
home-page =
    Autobot — main menu
    
    Choose a section using the keyboard below the input field.
    You can switch sections at any step. This will cancel the current input.
start-page =
    Welcome to Autobot!
    
    Create and schedule posts for your Telegram channels.
    The main menu is available at every step. Choose a section using the keyboard below the input field.
subscription-page =
    Plan: { $plan }
    Status: { $status }

    Channel limit: { $channels }
    Topic limit: { $topics }
    Text generations: { $textUsage }
    Image generations: { $imageUsage }
    Moderation revisions: { $revisionUsage }
    
    Images: { $images }
    Moderation: { $moderation }
availability-enabled = available
availability-disabled = unavailable
date-unspecified = no date
channels-item = • { $title }{ $username } — { $status }
posts-item = • { $title } — { $mode }, { $status }
posts-version-item =
    • #{ $version } — { $status }
    { $text }
topics-item = • { $name }
navigation-stale-button = This button has expired. Reopen the section.
navigation-fallback = Choose a section in the main menu or create a post with /createpost.
status-active = active
status-archived = archived
status-invalid = invalid
status-pending = pending
status-cancelled = cancelled
status-draft = draft
status-awaiting-moderation = awaiting moderation
status-delivery-unknown = delivery unknown
status-failed = failed
status-generating = generating
status-published = published
status-publishing = publishing
status-ready = ready
status-retry-wait = waiting for retry
status-skipped = skipped
status-approved = approved
status-generated = generated
status-generation-pending = awaiting generation
status-rejected = rejected
status-superseded = superseded
status-revision-requested = revision requested
status-completed = completed
status-paused = paused
status-expired = expired
status-past-due = payment overdue
status-trialing = trial
status-unknown = unknown status
