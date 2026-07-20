# Campaign Experiment Card

Create one card per variant in the private campaign state. Never put prospect
details in this public template.

```text
Generation:
Arm: A | B | C
Variant/source code:
Start date:
End date:

Audience:
Pain:
Hook:
Proof:
Price frame:
CTA:
Channel:

Single mutation from parent:
Parent variant:
Hypothesis: Changing only ______ should improve ______ because ______.

Minimum sample:
Completed actions:
Cash spend (CAD):
Execution cost (CAD):
Review minutes:
Delivery minutes:
Replies:
Qualified briefs:
Quotes:
Quoted contribution margin (CAD):
Paid bookings:
Cash collected (CAD):
Platform fees (CAD):
Refunds (CAD):
Complaints/opt-outs/warnings:

Contribution margin per Reid hour:
Qualified briefs per completed action:
Policy status: pass | paused | failed
Decision: winner | runner-up | archive | extend
Decision evidence:
Next mutation:
```

## Decision rules

- `contribution margin = collected - refunds - cash spend - platform fees - execution cost`
- `Reid hours = (review minutes + delivery minutes) / 60`
- Do not divide by zero; before Reid time exists, report “not measurable.”
- Do not eliminate below the minimum sample unless the variant has two paid
  bookings or a policy/safety failure.
- A policy-failed variant is archived even if it produced revenue.
- Change one mutation gene only and copy every other parent field exactly.

