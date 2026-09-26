# GVK Sportss — foundation and next decisions

## Product direction

A professional chess, badminton and sports engagement brand serving individual learners, schools, gated communities and corporates. The public experience introduces the brand; the member portal supports repeat visits; the admin portal owns operational content.

The supplied mobile mockup informs the dark green palette, restrained cards and mobile navigation. Gold accents reference the launch poster. Existing HTML files were used as design/content context, not embedded as the application architecture.

## Reference research

Hyderabad Chess School: https://www.hyderabadchessschool.com/ (reviewed 22 September 2026).
Relevant feature patterns: hobby/beginner learning, intermediate skills, competitive coaching, flexible schedules, tournaments and coaching-centre discovery. GVK uses original copy. The reference site's staff counts, reviews and other business claims were not copied.

PWA installation: https://web.dev/learn/pwa/installation
Installation and features vary across platforms and browsers. An installable responsive web app is appropriate for the initial booking/content workflows. Native React Native apps can reuse this backend later; expect new native UI implementation, not automatic reuse of DOM components.

## Implemented first phase

| Area         | Initial behavior                                                           |
| ------------ | -------------------------------------------------------------------------- |
| Public pages | Home, About, Coaching, Events, Gallery, Contact                            |
| Accounts     | Member signup/login/logout; separate protected admin portal                |
| Content      | Programs, pages, session slots, events, plans, image URLs                  |
| Memberships  | Member requests; administrator activates/cancels; duration-based expiry    |
| Coaching     | Individual published slots with start/end, capacity and member restriction |
| Events       | Published events, upcoming/past display, registrations, capacity           |
| Member area  | Bookings, registrations, memberships and cancellations                     |
| Admin area   | CMS records, member list, registration lists and enquiries                 |
| Responsive   | Desktop navigation; mobile/tablet navigation and responsive screens        |

## Decisions to gather next

1. Brand: exact public spelling (GVK Sportss / GVK_Sportss / GVK Sports), logo files, approved colors, contact details, venue addresses and social profile URLs.
2. Learners: adults only or children too? Must a parent account manage multiple learners? What guardian consent and photography permissions are required?
3. Coaching: group/private, online/offline, age bands, skill levels, coach profiles, batch capacity, recurring days, trial sessions and attendance.
4. Booking: coaching seats or court rental as well? Opening hours, advance booking window, duration, waitlists, cancellation cutoff and rescheduling.
5. Membership: sport-specific or combined; number of included sessions; monthly/quarterly plans; renewal rules; freeze/transfer rules; multiple concurrent plans.
6. Events: individual/team entry, age categories, public/member access, paid/free, registration deadlines, draws, results and refund policies.
7. Payments: pricing, taxes/invoices, provider, partial payments, offline payments and refund approval process. Only activate paid entitlements after verified server-side payment evidence.
8. Content: gallery photo/video sources and permissions, team profiles, testimonials with approval, editor roles and publishing workflow.
9. Operations: who can edit, publish, approve membership and view personal data? Need coach or receptionist roles?
10. Deployment: preferred Node hosting provider, database, domain, backup retention, monitoring and transactional email service.

## Recommended phases

- Foundation (this delivery): modular app, real auth, CMS, manual memberships, slots and events.
- Operational launch: confirm rules/content, MongoDB Atlas, media storage/uploads, email verification/reset, guardian profiles as applicable, staging, backups, monitoring and deployment.
- Payments and communication: verified payment orders/webhooks, entitlements, invoices/refunds and opt-in reminders.
- Coaching operations: coaches, recurring batches, attendance, learner progress, waitlists, venue/court schedules and results.
- Native app only if justified: consider when app-store distribution, reliable platform integrations or sustained daily use make the added maintenance worthwhile.

## Engineering practices

Use one repository with independently deployable frontend and API packages. Keep domain modules and shared UI primitives small. Enforce authorization and ownership in the API. Use database transactions and constraints for booking invariants. Store UTC timestamps and display academy time (Asia/Kolkata); admin datetime entry currently uses the operator's device timezone and labels it. Keep secrets outside source control. Version migrations and API changes. Preserve immutable financial records once payments are introduced. Back up persistent data and test restoration. Add tests around permissions, capacity, renewals and payment replay prevention as those features develop.

## Entity relationships

Users own sessions, bookings, event registrations and membership requests. Bookings reference coaching sessions. Registrations reference events. Memberships reference plans. Public/admin content resides in typed MongoDB collections. Audit records track administrator changes.
