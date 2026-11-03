# PulseIRL Event Tracking Plan & Analytics Taxonomy

This tracking plan establishes the production event taxonomy for PulseIRL across client platforms (Flutter Mobile, Next.js Web) and backend ingestion pipelines.

---

## 1. Core Conversion Funnel Events

| Event Name | Trigger Condition | Source | Key Properties | Downstream Consumers |
| :--- | :--- | :--- | :--- | :--- |
| `drop_viewed` | User navigates to event drop screen. | Flutter / Web | `eventId`, `userId`, `dropStatus`, `availableSeats`, `experimentKey`, `variant` | Mixpanel, ClickHouse, Prometheus |
| `hold_initiated` | User taps "Lock Spot". | Flutter / Web | `eventId`, `userId`, `slotCount`, `experimentKey`, `variant` | Mixpanel, Redis Lock Stream |
| `hold_acquired` | Redis Lua confirms spot hold with 300s lease. | Backend API | `eventId`, `userId`, `leaseKey`, `latencyMs`, `remainingSeats` | OpenTelemetry, Prometheus |
| `checkout_completed` | PostgreSQL transaction confirms ticket issuance. | Backend API | `eventId`, `userId`, `bookingId`, `idempotencyKey`, `slotNumber`, `holdDurationSec` | Data Warehouse, Stripe/Paystack Webhook Audit |
| `vibe_match_generated`| Attendee compatibility report computed. | Backend API | `userId`, `eventId`, `compatibilityScore`, `sharedInterests` | Personalization Engine |
| `invite_code_shared` | User shares viral referral link. | Flutter Mobile | `userId`, `inviteCode`, `shareChannel` | Growth Graph, Fraud Throttler |

---

## 2. Feature Flag & Experimentation Tracking

For every event associated with an active A/B test:
- `experimentKey`: Unique identifier (e.g., `fast_checkout_holdout`).
- `variant`: `A` (Treatment / Instant Hold) or `B` (Control / Standard Confirmation).
- `bucket`: MurmurHash3 integer value [0..99].

### Sample Ratio Mismatch (SRM) Audit
Every 10,000 requests, a background cron evaluates the chi-square goodness-of-fit test:
$$\chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}$$
If $p < 0.001$, an alert is triggered in the Next.js Ops Terminal indicating potential bucketing skew or bot contamination.
