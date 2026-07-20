# Campaign Operating Manual

This directory is the launch playbook for Reid's five founding-client spots. It
turns three different acquisition approaches into comparable 14-day tests while
keeping every external action truthful, selective, and auditable. Hermes may
operate trusted owned or officially integrated channels within the authority in
GOALS.md; protected-platform actions retain their required confirmation.

## Offer

Use this hook in channels that permit a direct offer:

> Tell me one annoying task you repeat. I'll outline the smallest useful tool
> that could eliminate it—free. If you want it built, founding-client projects
> start at CAD $40.

The free outline is a short scope recommendation, not design work, a prototype,
or a promise to build. Paid starter scopes are:

| Service | Direct starting price | Qualifying starter scope |
| --- | ---: | --- |
| Phone app | CAD $60 | One platform (iOS or Android), one focused flow of about 1–3 screens, local data, source, test build, one revision |
| Desktop app | CAD $60 | One target platform, one window, one local input-to-output workflow, source, packaged build, one revision |
| MCU firmware | CAD $40 | One supported board, one low-voltage peripheral, one defined behaviour, source, pinout, flash notes, one revision; client supplies reproducible hardware |

Accounts, payments, remote services, store submission, third-party charges,
ongoing support, extra platforms, extra flows, and extra revisions receive a
fixed quote. Direct starter work is paid in full before work begins. Larger
work uses fixed milestones. Count a founding spot only after payment.

Platform pricing must protect the same net amounts:

- Upwork: quote at least CAD $120 equivalent and keep all pre-contract contact
  and payment on Upwork.
- Fiverr: set the platform-supported price high enough to net at least CAD $60
  for an app or CAD $40 for firmware after its 20% share; the current floors are
  CAD $75 and CAD $50 equivalents.
- Contra and direct work: use the direct starting prices, then disclose any
  client-side or processing charge before payment.

Internally timebox a qualifying phone or desktop starter to about three build
hours, firmware to about two build hours, and the included revision to 30
minutes. These are operating guards, not public promises. Quote anything larger
before accepting payment.

## Hermes operating layer

Hermes is the accountable operator and sole writer of customer state. It uses
the installed `business-operator` skill, the deterministic campaign and
operator CLIs, and the gated `business-*` cron schedule documented in
`../HERMES_HANDOFF.md`.

The current strategy prioritizes high-intent and agent-compatible rails:

1. Contra's official MCP as the primary prepare-and-confirm business rail.
2. Passive productized listings on Contra and Upwork Project Catalog.
3. A LinkedIn personal-profile Service Page and selective local proof.
4. Current public requests and complementary partners, always within channel
   rules.

Customer communication is autonomous only after a trusted channel and external
evidence are connected and dry-run. Until then, Hermes prepares the complete
action and gives Reid the one required confirmation.

## Fourteen-day generation

Create one source code for each variant:
`G{generation}-{arm}-{variant}`, such as `G1-A-V1`. Use the source code in the
portfolio URL (`?src=G1-A-V1`) and in any platform note field that permits it.

1. Run all three arms from day 1 through day 14.
2. Give each arm equal research time and execution-cost allowance.
3. Meet the minimum sample for every arm before comparing it:
   - A, Intent Hunter: 12 qualified proposals.
   - B, Proof Challenge: 4 useful posts and 12 substantive replies.
   - C, Partner Relay: 10 relevant partner approaches.
4. Stop an arm immediately for a policy warning, complaint, false claim, unsafe
   request, or unauthorized automation. A stopped arm cannot win that generation.
5. At day 14, rank by collected contribution margin per Reid hour:

   `((cash collected - refunds - cash spend - platform fees - execution cost) / (review hours + delivery hours))`

6. If fewer than two arms have collected revenue, rank first by paid bookings,
   then qualified briefs per completed action, then quoted contribution margin,
   then lower complaint/opt-out count. Never use impressions or likes to break a
   tie.
7. Preserve the top two variants unchanged. Archive the weakest. Replace it with
   a clone of the winner that changes exactly one gene.
8. Allocate the next generation's capacity 40% to the winner, 30% to the
   runner-up, and 30% to the challenger.
9. Every third generation, make the challenger a new approach instead of a
   clone. This prevents repeatedly optimizing a weak local tactic.

A variant may win early only after two paid bookings. If a minimum sample is not
met, extend that arm rather than calling it a loser.

## Mutation genes

Change one field and preserve the rest:

1. `cta`: free outline vs. fixed-scope reply.
2. `audience`: solo operator vs. local service business vs. maker.
3. `pain`: repeated data entry vs. disconnected information vs. device control.
4. `proof`: Atlas vs. FLUX Studio vs. RAGdrop vs. a finished client result.
5. `price_frame`: from-price vs. fixed starter boundary.
6. `channel`: only between channels whose rules and audience fit the unchanged
   offer.

Mutation priority is CTA, audience, proof, then channel. Record the hypothesis
before launch: “Changing only **X** should improve **Y** because **Z**.” Do not
retrofit the hypothesis after seeing results.

## Metrics and capacity gates

A qualified brief has all four: a clear outcome, target device/platform, one
testable success condition, and willingness to discuss a realistic price.

Track actions, replies, qualified briefs, fixed quotes, payments, refunds,
complaints, platform charges, cash spend, execution cost, review minutes, and
delivery minutes. Store real prospect and financial records only in the private
ledger; never add them to this public campaign directory.

- Pause new acquisition at four active builds or five paid founding projects.
- Generation-one cash ceiling: CAD $25 total, with at most CAD $20 equivalent
  for Upwork Connects and one CAD $5 Craigslist services test.
- No ads, boosted proposals, subscriptions, or promoted listings in generation
  one.
- Unlock another CAD $25 only if the paid channel produces one booking or two
  qualified briefs and projected acquisition cost is under 20% of expected
  revenue.
- Hold the remaining CAD $50 until average booking value exceeds CAD $150.
- After five deliveries, raise prices if contribution margin is below CAD $20
  per Reid hour. Starting review point: CAD $149 for apps and CAD $99 for
  firmware.

## Daily exception and confirmation batch

On trusted owned or officially integrated channels, Hermes handles solicited
inbound, qualification, in-scope starter quotes, one permitted follow-up,
factual status messages, and review/referral requests. Reid handles credentials,
identity checks, protected-platform confirmations, custom commitments, and
exceptions. Until a channel passes activation tests, treat it as protected.

Use [the final-click checklist](templates/final-click.md). Review in this order:

1. Replies from people already in conversation.
2. Qualified proposals with a near deadline.
3. Helpful community replies.
4. Scheduled proof posts.
5. Partner introductions.

Hermes records the evidence and outcome immediately after each action. Never
work around a platform warning or retry an action the platform rejects.

## Arm playbooks

- [Intent Hunter](arms/intent-hunter.md)
- [Proof Challenge](arms/proof-challenge.md)
- [Partner Relay](arms/partner-relay.md)
- [Policy and safety gates](policy.md)
- [Account setup](templates/account-setup.md)
- [Offer menu](templates/offer-menu.md)
- [Message drafts](templates/messages.md)
- [Experiment card](templates/experiment-card.md)

## Day-one launch order

1. Connect and verify Telegram owner alerts.
2. Reid completes required identity and payout fields; connect Contra's
   official MCP through OAuth and verify its confirmation flow.
3. Record the real business disclosures, terms, and payment evidence source.
4. Publish the bounded offer menu on eligible passive profiles.
5. Create `G1-A-V1`, `G1-B-V1`, and `G1-C-V1` in the private ledger.
6. Dry-run all customer, policy, payment, restart, and notification gates.
7. Activate one trusted channel, then queue a fair initial sample for each arm.
8. Review safety and capacity daily; review performance on days 7 and 14.

## Operating-cost gate

Use deterministic checks and stored templates before invoking a model. A gate
must find real work before waking an agent. Cap each research run to its stated
tool calls and candidates, keep reports to five lines, and record actual model
usage when available. Unknown usage is not zero. Pause a tactic if model plus
cash cost would exceed 20% of expected contribution margin.
