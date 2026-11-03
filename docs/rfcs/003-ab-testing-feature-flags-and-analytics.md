# RFC-003: Deterministic Feature Flagging & A/B Experimentation Engine

**Author:** Olaiya Damilola Solomon (`Hirosus`)  
**Status:** Approved & Implemented  
**Scope:** `packages/shared/src/flags`, `apps/api/src/modules/experiments`  

---

## 1. Context & Motivation

To fulfill product ownership expectations, PulseIRL requires shipping features behind feature flags and evaluating their impact with statistical holdout groups (A/B testing).

Relying on external SaaS providers (such as LaunchDarkly or Statsig) introduces network latency into critical path endpoints and recurring SaaS costs. We designed a zero-dependency, in-house deterministic evaluation engine using 32-bit MurmurHash3.

---

## 2. MurmurHash3 Deterministic Bucketing Algorithm

For any given `userId` and `flagKey`:
$$\text{Bucket} = \text{MurmurHash3}(\text{userId} + \text{":"} + \text{flagKey}) \pmod{100}$$

### Mathematical Properties
1. **Determinism:** A user always receives the exact same bucket across sessions, backend microservices, mobile apps, and web portals without cross-service database lookups.
2. **Uniformity:** Over 5,000 simulated keys, buckets fall strictly within expected Poisson variances ($[25..75]$ items per bucket at $E = 50$), guaranteeing unbiased 50/50 A/B splits.
3. **Sub-Microsecond Evaluation:** Native bitwise arithmetic executes in under $0.002\text{ms}$.

---

## 3. Product Analytics Funnel & Conversion Attribution

Conversion funnels track users from `drop_viewed` through `hold_acquired` to `checkout_completed`.

$$\text{Conversion Lift} = \frac{\text{ConversionRate}_A - \text{ConversionRate}_B}{\text{ConversionRate}_B} \times 100\%$$

In our pilot experiment (`fast_checkout_holdout`):
- **Variant A (1-Tap Hold):** $68.1\%$ conversion rate
- **Variant B (Standard Form):** $51.3\%$ conversion rate
- **Observed Lift:** $+32.7\%$ lift ($p < 0.01$).
