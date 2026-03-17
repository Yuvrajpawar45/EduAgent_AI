# EduAgent Future Roadmap

This file stores the next upgrades so we can continue from here anytime.

## Built now
- Student login with `student_id + password`
- Per-student fee ledger with reminder actions
- Document center with real download tracking

## Next (when you ask)
- Role-based accounts (`admin`, `student`, `accounts`, `exam-cell`)
- Student signup/reset-password flow
- Escalation ownership + SLA timers + email/WhatsApp alerts
- Exam hall ticket generation workflow
- Fees payment reconciliation (gateway/webhook + receipt history)
- Smart reminders (auto schedule + templates + retry rules)
- Document permissions by program/semester + expiry windows
- Analytics dashboard (query trends, unresolved escalations, document usage)
- Audit logs for all admin actions
- Notification center (in-app + email + SMS)

## Data entities planned
- `users`
- `students`
- `student_fee_ledger`
- `fee_payments`
- `fee_reminders`
- `documents`
- `download_events`
- `exam_events`
- `escalations`
- `audit_logs`
