# CURRICULUM

*SSOT store — this document. No prior writer registered in `.claude/reference/ssot_structure.md`;
written here by `learning-curriculum-sequencer` reading GOALS, STUDENT_PERSONAS, LOGISTICS, and DESIGN.*

Course: **Spring Cloud Gateway for a Strangler-Fig Migration to GKE**

## How this document was built

Sequencing rule (priority order):
1. Reach each `DesiredResult` (DR) as quickly as the `Requires` edges in
   `design/knowledge_goals_graph.json` allow.
2. An assessment follows every DR.
3. A final assessment follows all five DRs.
4. Every node gets a delivery style and support materials.

The graph has **30 nodes**: 4 `Baseline` (already held by personas, not taught), 5
`DesiredResult`, 21 `Prerequisite`. This document sequences all **26 taught nodes**
(5 DR + 21 PRQ) — enumerated once each below; none dropped.

`Requires` edges read `from` needs `to`, so `to` is taught first. Session length is
budgeted at **~210 usable minutes** per 4h block (8h nominal − Teams start-up, breaks,
context-switching), not the full 240 — the arithmetic per session is shown so a reviewer
can check it, per LOGISTICS' 2×4h/week-apart structure.

## Cross-cutting design decisions (flag for human review)

- **`PRQ-LEGACY-TOKEN-FORMAT` is a delivery blocker, not a lesson.** It is tagged
  `root: true` / `provenance: risk` in DESIGN because its content — the legacy app's exact
  token shape — must come from the client, not from any prior node. **Action required
  before Session 2:** the client must supply the legacy token's claim structure. **Owner:**
  course sponsor / client-side architect. **Due:** end of the inter-session week (before
  Session 2). **Fallback if late:** the lesson runs on an invented, clearly-labelled
  stand-in token spec so `PRQ-TOKEN-MINTING-LOGIC` can still be taught; the real mapping is
  substituted once supplied, as homework or a short addendum.
- **Session 1 deploys a routeless gateway.** `DR-DEPLOY-GATEWAY`'s dependency chain
  (`PRQ-SCG-BASICS → PRQ-CONTAINERIZE-GATEWAY/PRQ-K8S-DEPLOY-CONCEPTS →
  PRQ-GKE-DEPLOY-GATEWAY`) never touches `PRQ-GATEWAY-ROUTE-CONFIG`. That is what the
  graph's edges require, not an oversight — the gateway that goes live in Session 1 has no
  routes configured yet; routing arrives with G2 immediately after.
- **Opening with `PRQ-STRANGLER-FIG-PATTERN` is a deliberate ~10 min deviation from pure
  quickest-path**, not something the graph forces before `DR-DEPLOY-GATEWAY`. It is placed
  first anyway for problem-first framing (the "why" behind the whole course, per GOALS) —
  the cost is ~10 minutes against the fastest possible route to the first DR.
- **`DR-TRACING` is deliberately sequenced before `DR-VALIDATE-AUTH`** in Session 2. No
  `Requires` edge forbids either order, and `DR-TRACING`'s remaining chain (3 new nodes) is
  shorter than `DR-VALIDATE-AUTH`'s (5 new nodes) at that point, so the quickest-path rule
  places it first. A second benefit: the OTel collector pipeline is live before the
  dev-heavy token-minting block, so Ops can watch the minted-token hop in a real trace during
  that block (see below) instead of sitting idle.
- **Ops-lane risk in the token-minting block.** `PRQ-CUSTOM-GLOBALFILTER-AUTHORING`,
  `PRQ-JWT-FUNDAMENTALS-DEEP`, `PRQ-TOKEN-MINTING-LOGIC`, `PRQ-TOKEN-PROPAGATION` are all
  `audience: ["P-DEV"]` in DESIGN — the single longest Spring-only stretch in the course,
  and exactly the "Ops gets lost in code deep-dives" risk STUDENT_PERSONAS names for Sara.
  Each of these nodes below carries an explicit Ops lane (wiring the signing-key secret,
  calling the legacy endpoint, watching the trace) so Ops has a role throughout, not just a
  spectator seat. Same fix applied at `PRQ-K8S-DEPLOY-CONCEPTS` (`skippable_by: ["P-OPS"]`
  in DESIGN) — Ops takes the explainer role there rather than skipping silently.
- **Homework in the inter-session week** (LOGISTICS notes this is feasible): read
  `PRQ-JWT-FUNDAMENTALS-SHALLOW` material, complete the Entra ID app-registration
  environment check, and chase the `PRQ-LEGACY-TOKEN-FORMAT` deliverable above. This is why
  Session 2 opens with a 5-minute recap instead of a full lecture on JWT structure.
- This document does not certify that `design/knowledge_goals_graph.json` passes
  `tools/graph/graph check` — that check has not been run here; run it separately before
  treating the graph as validated.

---

## Session 01 — Deploy & Route (target ≈175 min of 210)

Two-lane pattern per the cross-persona directive in STUDENT_PERSONAS: shared framing →
split by role (dev code lane / ops config-and-operate lane) → reconverge on a shared
verification.

| # | Node ID | Topic | Style | Duration | Lane(s) | Support material |
|---|---|---|---|---|---|---|
| 1 | `PRQ-STRANGLER-FIG-PATTERN` | The strangler-fig pattern — why this course exists | Front-of-class lecture + discussion | 10 min | Shared | 1-page diagram of the migration; Martin Fowler's "StranglerFigApplication" article |
| 2 | `PRQ-SCG-BASICS` | Spring Cloud Gateway as edge reverse-proxy | Front-of-class lecture | 15 min | Shared | Spring Cloud Gateway reference docs (Overview); architecture diagram slide |
| 3 | `PRQ-K8S-DEPLOY-CONCEPTS` | Deployment / Service / Ingress on GKE | Lecture, **Ops-led explainer** (`skippable_by: P-OPS`) | 10 min | Ops explains to devs; devs ask questions | GKE "Concepts" quick-reference sheet; existing cluster's actual Deployment/Service YAML as a worked example |
| 4 | `PRQ-CONTAINERIZE-GATEWAY` | Building the gateway's container image | Hands-on practical, two-lane | 20 min | Dev: writes Dockerfile · Ops: runs build/publish pipeline, registry | Sample Dockerfile skeleton; internal registry push guide |
| 5 | `PRQ-GKE-DEPLOY-GATEWAY` | Deploying the image to the GKE cluster | Hands-on practical, two-lane | 30 min | Ops: leads manifests/deploy · Dev: reads deployment shape for later debugging | Manifest template (Deployment+Service); `kubectl`/`gcloud` cheat-sheet |
| — | `DR-DEPLOY-GATEWAY` | **G1 achieved: gateway running on GKE** | Embedded checkpoint inside item 5's last 5–10 min | (in 5) | Both confirm reachability together | Smoke-test script (`curl` against the exposed service) |
| A1 | *Assessment* | Practical check: gateway responds on GKE | Hands-on, pass/fail rubric | 5 min | Both | Rubric: service exposed, health endpoint returns 200 |
| 6 | `PRQ-GATEWAY-ROUTE-CONFIG` | The route/predicate/filter model | Front-of-class lecture + live demo | 20 min | Shared, then dev reads Java DSL / ops reads YAML | SCG "Route Predicate/Filter Factories" reference; annotated YAML vs Java DSL side-by-side |
| 7 | `PRQ-PATH-BASED-ROUTING` | Splitting traffic by path | Front-of-class lecture | 10 min | Shared | Diagram: `/legacy/**` vs new-path routing |
| 8 | `PRQ-LEGACY-VS-NEW-ROUTING-IMPL` | Implementing the concrete legacy-vs-new split | Hands-on practical, two-lane | 25 min | Dev: writes/adjusts route rules · Ops: deploys config, verifies split | Route-config exercise sheet; test-request list (which paths should land where) |
| — | `DR-STRANGLER-ROUTING` | **G2 achieved: traffic splits by path** | Embedded checkpoint inside item 8's last 5–10 min | (in 8) | Both | — |
| A2 | *Assessment* | Practical check: send both path types, confirm split | Hands-on, pass/fail rubric | 5 min | Both | Rubric: `/legacy/**` request hits legacy, other paths hit migrated service |

**Session 1 total:** 10+15+10+20+30+5+20+10+25+5 = **150 min** of teaching/assessment,
leaving ~25 min buffer against the 175 target and ~60 min slack against the 210 ceiling for
Teams friction, Q&A overrun, and breaks.

**Homework before Session 2:** read `PRQ-JWT-FUNDAMENTALS-SHALLOW` material; verify each
participant's Entra ID app-registration access; client delivers `PRQ-LEGACY-TOKEN-FORMAT`
(see risk note above).

---

## Session 02 — Secure, Trace, Migrate the Token (target ≈195 min of 210)

| # | Node ID | Topic | Style | Duration | Lane(s) | Support material |
|---|---|---|---|---|---|---|
| 0 | `PRQ-JWT-FUNDAMENTALS-SHALLOW` | JWT structure recap (pass 1 — validation depth) | Group discussion (recap of homework reading) | 5 min | Shared | Homework reading: JWT.io "Introduction"; already assigned |
| 1 | `PRQ-DISTRIBUTED-TRACING-CONCEPTS` | Traces, spans, context propagation | Front-of-class lecture | 10 min | Shared | OpenTelemetry "Observability primer"; trace diagram slide |
| 2 | `PRQ-OTEL-COLLECTOR-PIPELINE` | Standing up the OTel collector | Hands-on practical, two-lane | 20 min | Ops: deploys/operates collector · Dev: understands pipeline for later debugging | OTel Collector quick-start config; docker-compose or GKE sidecar example |
| 3 | `PRQ-OTEL-INSTRUMENTATION-GATEWAY` | Instrumenting the gateway to propagate/initiate trace context | Hands-on practical, two-lane | 15 min | Dev: adds/verifies instrumentation in code · Ops: wires exporter config on the deployment | Spring Cloud Gateway + OTel starter reference; exporter config snippet |
| — | `DR-TRACING` | **G5 achieved: gateway participates in tracing** | Embedded checkpoint inside item 3's last 5 min | (in 3) | Both view a completed trace together | Tracing backend UI (Jaeger/Tempo/whatever the org runs) |
| A3 | *Assessment* | Practical check: one request produces one visible end-to-end trace | Hands-on, pass/fail rubric | 5 min | Both | Rubric: trace spans gateway → microservice/legacy |
| 4 | `PRQ-CORS-CONCEPT` | What CORS is, why browsers enforce it | Front-of-class lecture | 8 min | Shared | MDN "CORS" article; preflight-request diagram |
| 5 | `PRQ-OAUTH-OIDC-ENTRA` | How Entra ID issues tokens (tenant, issuer, JWKS) | Front-of-class lecture | 12 min | Dev: consumes issuer/JWKS in code · Ops: configures app registration, supplies values | Entra ID app-registration walkthrough (from homework); OIDC discovery-document example |
| 6 | `PRQ-CORS-GATEWAY-CONFIG` | Configuring CORS at the gateway | Hands-on practical, two-lane | 15 min | Dev: sets config · Ops: verifies against real client calls | Gateway CORS config snippet; browser dev-tools preflight check guide |
| 7 | `PRQ-GATEWAY-JWT-VALIDATION-FILTER` | Validating incoming Entra JWTs at the gateway | Hands-on practical, two-lane | 20 min | Dev: implements resource-server validation on the route · Ops: wires tenant/JWKS values, verifies accept/reject | Resource-server config sample; valid/invalid-token test pair |
| — | `DR-VALIDATE-AUTH` | **G3 achieved: incoming JWT validated + CORS applied** | Embedded checkpoint inside item 7's last 5 min | (in 7) | Both | — |
| A4 | *Assessment* | Practical check: accepted/rejected token + CORS behavior | Hands-on, pass/fail rubric | 5 min | Both | Rubric: valid token passes, invalid rejected, cross-origin call succeeds |
| 8 | `PRQ-CUSTOM-GLOBALFILTER-AUTHORING` | Writing a custom `GlobalFilter`/`GatewayFilter`, reactive gotchas | Hands-on practical, **dev code lane** | 15 min | Dev: writes filter · Ops: reads the filter-ordering diagram, tracks where in the chain it runs | Filter-chain ordering diagram; WebFlux reactive-pitfalls cheat-sheet |
| 9 | `PRQ-JWT-FUNDAMENTALS-DEEP` | Constructing a new JWT from validated claims (pass 2) | Hands-on practical, **dev code lane** | 12 min | Dev: builds the token · Ops: maps which Entra claims feed which legacy claims, on paper | Claim-mapping worksheet (Entra claim → legacy claim) |
| 10 | `PRQ-LEGACY-TOKEN-FORMAT` | The legacy app's expected token shape | Briefing (client deliverable, or fallback stand-in) | 8 min | Shared | Client-supplied token spec **or**, if not yet delivered, the labelled stand-in spec (see risk note) |
| 11 | `PRQ-TOKEN-MINTING-LOGIC` | Minting the internal token from validated Entra claims | Hands-on practical, two-lane | 20 min | Dev: codes the minting filter · Ops: provisions/wires the signing-key secret on the GKE deployment | Token-minting filter skeleton; secret-management (K8s Secret / Secret Manager) guide |
| 12 | `PRQ-TOKEN-PROPAGATION` | Rewriting the outgoing request with the minted token | Hands-on practical, two-lane | 15 min | Dev: rewrites the `Authorization` header · Ops: calls the legacy endpoint to verify the propagated header, watches the hop in the Session-2-item-3 trace | `curl` script against the legacy stub; trace UI (reused from item 3) |
| — | `DR-MINT-TOKEN` | **G4 achieved: downstream token minted & propagated** | Embedded checkpoint inside item 12's last 5 min | (in 12) | Both | — |
| A5 | *Assessment* | Practical check: legacy endpoint accepts the minted token | Hands-on, pass/fail rubric | 5 min | Both | Rubric: legacy stub returns success on the propagated token |
| 13 | *Final assessment* | **All five DRs together**: one request through the full gateway (routed, authenticated, token-swapped, traced) | Project-based capstone, two-lane | 20 min | Dev + Ops jointly present the working path | End-to-end checklist covering G1–G5; capstone rubric |

**Session 2 total:** 5+10+20+15+5+8+12+15+20+5+15+12+8+20+15+5+20 = **210 min**.

This fills the full 210 usable minutes with no slack — flag for human review: consider
moving item 10 (`PRQ-LEGACY-TOKEN-FORMAT` briefing) or the claim-mapping worksheet portion
of item 9 to pre-session homework if Session 1 or the JWT recap overruns, since Session 2 has
no buffer built in.

---

## Node coverage check

26 taught nodes, each appears exactly once above:

- DR (5): `DR-DEPLOY-GATEWAY`, `DR-STRANGLER-ROUTING`, `DR-TRACING`, `DR-VALIDATE-AUTH`, `DR-MINT-TOKEN`
- PRQ (21): `PRQ-STRANGLER-FIG-PATTERN`, `PRQ-SCG-BASICS`, `PRQ-K8S-DEPLOY-CONCEPTS`,
  `PRQ-CONTAINERIZE-GATEWAY`, `PRQ-GKE-DEPLOY-GATEWAY`, `PRQ-GATEWAY-ROUTE-CONFIG`,
  `PRQ-PATH-BASED-ROUTING`, `PRQ-LEGACY-VS-NEW-ROUTING-IMPL`,
  `PRQ-DISTRIBUTED-TRACING-CONCEPTS`, `PRQ-OTEL-COLLECTOR-PIPELINE`,
  `PRQ-OTEL-INSTRUMENTATION-GATEWAY`, `PRQ-CORS-CONCEPT`, `PRQ-OAUTH-OIDC-ENTRA`,
  `PRQ-CORS-GATEWAY-CONFIG`, `PRQ-GATEWAY-JWT-VALIDATION-FILTER`,
  `PRQ-CUSTOM-GLOBALFILTER-AUTHORING`, `PRQ-JWT-FUNDAMENTALS-DEEP`,
  `PRQ-LEGACY-TOKEN-FORMAT`, `PRQ-TOKEN-MINTING-LOGIC`, `PRQ-TOKEN-PROPAGATION`,
  `PRQ-JWT-FUNDAMENTALS-SHALLOW` (taught as homework + Session 2 item 0 recap)

Baselines not taught (already held per DESIGN `held_by`): `BSL-DOCKER`, `BSL-GKE-CONTAINERS`,
`BSL-REST`, `BSL-SPRING-BOOT`.

Final assessment (capstone, item 13 in Session 2) covers all five DRs together, as required.
