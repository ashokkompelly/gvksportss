# API reference (v1 foundation)

All responses are JSON. Errors have `{ "error": "message" }`. Cookie sessions are required for authenticated routes. All write requests require the `Origin` header to equal configured `APP_ORIGIN`. The frontend automatically uses browser cookies; do not store login tokens in localStorage.

| Method | Route                         | Access / purpose                                           |
| ------ | ----------------------------- | ---------------------------------------------------------- |
| GET    | /api/health                   | Health check                                               |
| GET    | /api/auth/me                  | Current user or null                                       |
| POST   | /api/auth/signup              | Member account: name, email, password                      |
| POST   | /api/auth/login               | Email and password                                         |
| POST   | /api/auth/logout              | Revoke current session                                     |
| GET    | /api/catalog/:kind            | Published content; slots/events include remaining capacity |
| POST   | /api/enquiries                | Name, email, optional organization, message                |
| GET    | /api/member                   | Own bookings, registrations, memberships                   |
| POST   | /api/member/bookings          | Reserve coaching slot: `{id: slotId}`                      |
| DELETE | /api/member/bookings/:id      | Cancel own booking record                                  |
| POST   | /api/member/registrations     | Reserve event: `{id: eventId}`                             |
| DELETE | /api/member/registrations/:id | Cancel own registration record                             |
| POST   | /api/member/memberships       | Request plan: `{id: planId}`                               |
| DELETE | /api/member/memberships/:id   | Cancel own membership/request                              |
| GET    | /api/admin/overview           | Admin accounts, requests, enquiries and reservations       |
| GET    | /api/admin/:kind              | Admin content including drafts                             |
| POST   | /api/admin/:kind              | Create validated content record                            |
| PUT    | /api/admin/:kind/:id          | Replace validated content record                           |
| DELETE | /api/admin/:kind/:id          | Delete unreferenced content                                |
| PATCH  | /api/admin/memberships/:id    | `{status: "active"}` or `{status: "cancelled"}`            |

Kinds: `pages`, `programs`, `slots`, `events`, `plans`, `gallery`. Fields and constraints are centralized in `apps/api/src/modules/schemas.js`. Unknown fields are stripped. Dates are ISO 8601 timestamps with timezone offsets; admin browser converts local datetime inputs to UTC.

Payment endpoints are deliberately absent until the provider and billing rules are agreed. Membership cancellation currently changes access status only; it does not trigger financial refunds.
