# Universe B — the point-in-time manager universe

Universe A is today's list of 100 widely followed managers. Selecting it uses information that did not
exist at most historical dates (reputations, track records, who survived), so any backtest on it carries
manager-selection bias. Universe B removes that by re-selecting managers each quarter from **every 13F
filer**, using only rules an investor could have applied with the filings available at that date.

## Rules (applied at each report period t, using filings accepted up to the trading date)

A filer is eligible at t if all of the following hold on its ORIGINAL 13F-HR snapshots:

1. **History**: at least 8 consecutive quarterly 13F-HR filings before t (two years of observable behaviour).
2. **Scale**: long-equity 13F value between $500 million and $150 billion at t−1. The floor removes
   filers whose holdings are too small to be meaningful; the cap removes the custodial/passive giants,
   whose disclosures aggregate thousands of mandates.
3. **Concentration (an active-manager proxy)**: top-10 positions ≥ 35 % of long-equity value **and**
   between 8 and 250 long equity positions. This excludes index-like and platform portfolios without
   naming them.
4. **Activity**: at least one new position or full exit in each of the last four quarters (a live,
   decision-making portfolio, not a static holding company).
5. **Not a reporting conduit**: no `OTHERINCLUDEDMANAGERSCOUNT` ≥ 10 (combined reports of many
   sub-advisers) and not flagged as a bank trust department by name pattern (BANK, TRUST CO, N.A.).

From the eligible set, the **top 100 by trailing 8-quarter copy-portfolio return**, computed only from
filings and prices available at t, form Universe B(t). Ties and missing returns are broken by scale.
This is deliberately a *performance-chasing* rule, because that is what an investor "following the best
managers" would actually have done, and it is the rule whose survivorship we need to test.

A second variant, **B-static**, selects on rules 1–5 only, ranked by scale, to separate the effect of
chasing performance from the effect of filtering on observable activity.

## What is kept

* Defunct managers (Melvin, Omega, Passport, Blue Ridge, SAC, legacy Elliott entity …) remain in the pool
  for the quarters they filed. A manager that ceases filing simply drops out of B(t) at the next cut.
* Name and CIK changes are handled at the filing-entity level; nothing is linked by hindsight unless the
  cover page itself names the predecessor.
* Managers who later became famous enter B(t) only when the rules admit them.

## What is compared

Every strategy in the backtest report is run on Universe A and Universe B. A result that holds on A and
not on B is attributed to manager selection, not to 13F information.
