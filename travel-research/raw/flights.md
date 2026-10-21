# Flight connectivity research — December 2026 workation + Siem Reap family meet-up

Prepared 2026-10-21 for the route decision. Data table: `flights.csv` in this folder, 142 rows, one row per itinerary option.

**Verification legend**
- **V1-live (Expedia 2026-10-21):** returned by a live Expedia `search_flights` call today.
- **V2-schedule source:** a web schedule source or news report (URL given).
- **E:** estimate or derived (for example, two V1 legs combined by hand, or an arrival time calculated from a stated duration).
- **U:** unknown. A search with no results is recorded as U, not as "no service".

**Units.** Times are local. Time zones: HYD/CCU UTC+5:30; BKK/HKT/SAI/PQC/SGN UTC+7; SIN/KUL/LGK/PEN/DPS UTC+8. Fares are Expedia totals in USD including taxes for the party searched: 2A = 2 adults; family = 2 adults + children aged 9 and 7. Fares change daily and are not held.

**How far to trust "nothing found" (read this before relying on a missing option)**
- Expedia's default results are **partial**. Some nonstops only appeared with an airline filter: SQ740 SIN–HKT and TG329 BKK–HYD.
- **Thai AirAsia (FD) and AirAsia (AK) are not sold on Expedia.** DMK–SAI, KUL–SAI (AK) and HKT–SAI nonstop all returned nothing on Expedia, but web sources show FD operating DMK–SAI and HKT–SAI.
- On LCC results, `seats_left: 0` looks like "unknown", not "sold out".
- Expedia labels its results for the Dec 28 and Dec 31 searches as "December 28/31, 2027", although the request and the returned `departure_date` are 2026. Treat this as a display bug and re-check the date at booking.

---

## A. Structural findings (who flies where)

### Siem Reap airport
- **SAI (Siem Reap–Angkor International, ICAO VDSA)** opened 16 Oct 2023. All commercial traffic moved there from the old **REP**, which is closed (V2: opendevelopmentcambodia, Wikipedia).
- Some booking systems and directories still show REP; book SAI.
- SAI is about 50 km east of Siem Reap town, roughly a 1-hour road transfer (E).

### Airlines serving SAI in the 2026/27 winter season (verified on Expedia for 24 and 28 Dec unless marked)

| From/to | Carrier | Flights seen | Status |
|---|---|---|---|
| **BKK (Suvarnabhumi)** | Thai Airways | TG588 07:45 → SAI 08:45; return TG589 09:50 | V1 |
| BKK | Bangkok Airways | PG903 07:55, PG905 11:20, PG907 17:25 to SAI; returns PG924 09:55, PG906 13:20, PG908 19:25 | V1 |
| BKK | Cambodia Airways (ATR72) | KR722 17:50 → SAI 19:20; KR721 SAI 12:10 → BKK | V1. Also V2: 5x weekly from 15 Sep 2026 per AeroRoutes |
| BKK | Emirates | EK370 19:50 → SAI 21:10 (tag of Dubai–Bangkok, running since 3 Jun 2025) | V1 + V2 |
| **DMK (Don Mueang)** | Thai AirAsia | about 14 weekly (directflights, updated Jul/Aug 2026; FD615 tracked 4 Oct 2026) | V2 only — **not on Expedia** |
| **HKT** | Thai AirAsia | FD612 14:30 → SAI 16:05; FD613 SAI 16:50 → HKT | V2 only. Restored 25 Oct 2026 for the high season (Thaiger, deeparrival, explera). Flightmapper says daily from 25 Oct; AeroRoutes (16 Oct 2026) says 4x weekly Jan–Mar 2027 "instead of increasing to daily". **Whether it flies Thu 24 Dec is U.** Expedia nonstop HKT→SAI search: no results. |
| **SIN** | Singapore Airlines | SQ164 morning (operating Fri 18 Dec, V1); SQ166 14:40 → 16:00 (Thu 24 Dec, **Business only** offered); returns SQ163 10:45, SQ165 16:50 | V1. About 10 weekly (V2 directflights) |
| SIN | Jetstar Asia | Carrier ceased 31 Jul 2025; SIN–SAI was among dropped routes | V2. No Scoot or other replacement found. **SQ is the only SIN–SAI carrier.** |
| **SGN** | Vietnam Airlines | VN813 (arr SAI 17:40), VN815 (arr 20:30); VN814 SAI 21:30 | V1 |
| SGN | Air Cambodia | K6829 (arr SAI 21:45) | V1 |
| **HAN** | Vietnam Airlines | VN837 → SAI | V1 |
| HAN | VietJet | VJ914 SAI 19:05 → HAN | V1 |
| **LPQ** | Vietnam Airlines | VN931 14:35 → SAI 16:10 (nonstop) | V1 |
| LPQ | Lao Airlines | QV513 08:30 → SAI 11:50, one stop at Pakse on the same flight number | V1 |
| **KOS (Sihanoukville)** | Air Cambodia | K6130 11:05 → SAI 12:10 | V1 |
| **CCU (Kolkata)** | IndiGo | 6E1655 → SAI arr 08:00 Thu 24 Dec; 6E1656 SAI 09:00 Mon 28 Dec | V1. V2: Mon/Thu/Sat, suspended 3 Jul–30 Sep 2026, resumed 1 Oct 2026 |
| **KUL** | Firefly | Launched 27 Nov 2025 (Tue/Thu/Sat), reportedly halted Feb 2026 | V2, single forum source |
| KUL | AirAsia | Not on Expedia | U |
| KUL | Malaysia Airlines | No KUL–SAI nonstop seen; MH only via SGN or BKK | V1 for the connections |
| PNH | — | Not searched (Cambodia Airways added SAI–PNH/KOS per CAPA) | U |

### India–Cambodia nonstop
**IndiGo Kolkata–Siem Reap is the only one** (Mon/Thu/Sat, A320neo). It operates on both key dates:
- Thu 24 Dec inbound: 6E1655, V1.
- Mon 28 Dec outbound: 6E1656, V1.

There is no Hyderabad–Cambodia nonstop.

### Hyderabad international links relevant here (V1 unless marked)

| Route | Nonstop flights (local times) | Notes |
|---|---|---|
| **HYD–BKK** | TG330 01:30–06:30; TG358 16:35–21:35; 6E1509 09:20–14:30 | Returns: TG329 BKK 21:50–HYD 23:55; 6E1510 BKK 15:30–17:50. Akasa is mentioned by a blog (V2, weak). |
| **HYD–KUL** | MH199 00:30–07:30 | Return MH198 lands HYD 23:20. IndiGo and AirAsia X are claimed by a blog but not seen. |
| **HYD–SIN** | SQ519 10:55–18:30; SQ523 23:10–06:15(+1); 6E1027 21:50–05:10(+1) | |
| **HYD–HKT** | Air India Express IX976 06:15–11:40 (also sold as AI6655) | Confirmed for Fri 18 Dec. 2026 frequency sources conflict: 2/wk vs daily vs 8/wk (V2). |
| **HYD–Vietnam** | VN984 HYD 23:55 → HAN; VietJet VJ1803 SGN → HYD | Both V1 |
| **HYD–DPS** | No nonstop | Via KUL, BKK, SIN or HKG |

---

## B. Leg-by-leg findings

### Leg 1a — Couple, Singapore → workation, Fri 18 Dec (2 adults)

| Dest | Best options found | Total for 2 |
|---|---|---|
| **BKK** | Nonstops: TG402 08:15, TG404 12:25, SQ720 18:35, Scoot ×3 | $530 (Scoot) – $873 (SQ) |
| **HKT** | Scoot TR658 08:40 / TR644 12:00 / TR652 18:15; SQ740 18:35 (Economy Flexi, only found with SQ filter); MH via KUL from 06:20 | Scoot $654–1,100; SQ740 $1,317; MH $852 |
| **DPS** | SQ934 06:45, SQ938 09:15, Scoot, Jetstar, KLM — all nonstop | SQ $490; LCC from $268 |
| **USM** | Bangkok Airways PG968 17:20 and PG962 20:10; Scoot ×4 | PG $961 |
| **KBV** | Scoot TR682 10:55, TR548 16:50 (only nonstops); MH/Firefly via KUL | Scoot $689 |
| **LGK** | Scoot TR478 08:05, TR476 15:05; MH via KUL (1h40) | about $447 |
| **PQC** | VietJet VJ984 13:05 (20 kg bag included); Sun PhuQuoc 9G 14:20 (fare excludes all bags per Expedia); Scoot TR538 17:00 | $480–558 |
| **CNX** | Scoot TR696 09:00, TR698 13:35; TG via BKK | Scoot $653–748; TG $1,090 |
| **PEN** | SQ132 07:50, SQ134 09:40, Scoot TR424 | $378–778 |
| **LPQ** | No nonstop. TG/PG via BKK, 5h50 | $1,641 |
| **KOS** | Expedia: no flights found | U |
| **KUL** | Many MH nonstops (06:20–16:35) seen as legs of other itineraries | Fares not isolated |

### Leg 1b — Couple, Hyderabad → workation, Fri 18 Dec (2 adults)
A "01:30 Dec 18" departure is effectively the night of Thursday 17 Dec.

| Dest | Best options found | Total for 2 |
|---|---|---|
| **BKK** | Nonstops: TG330 01:30–06:30, 6E1509 09:20–14:30, TG358 16:35–21:35 | $427–464 |
| **HKT** | IX976 06:15–11:40 nonstop (Lite fare has no checked bag; AI6655 Eco Value includes 25 kg); IndiGo via BOM 8h15 | $527–571 |
| **KUL** | MH199 00:30–07:30 nonstop | $695 |
| **SIN** | SQ519 10:55–18:30 nonstop; overnight SQ523 and 6E1027 | $452–627 |
| **KBV** | TG330 + TG241 via BKK, 01:30–08:55, tight 1h05 connection | $593 |
| **CNX** | TG330 + TG102 via BKK, 01:30–08:45, 55-minute connection (TG122 alternative arrives 10:20) | $589 |
| **USM** | TG330 + TG5904 (operated by PG) via BKK, 01:30–09:20 | $1,221 (Flexi only) |
| **LGK** | MH199 + MH1432 via KUL, 00:30–10:20 | $761 |
| **DPS** | MH199 + MH715 via KUL, 00:30–12:05 | about $818 (TG via BKK similar) |
| **PEN** | TG330 + TG427 via BKK, arrives 11:55 | $622 |
| **PQC** | No good option: CX via HKG 14h30, or VN via HAN arriving Dec 19 | about $1,035–1,054 |
| **LPQ** | TG/PG via BKK 10h05 ($1,456), or VN via HAN overnight | |
| **KOS** | AI + K6 two-stop, 24h35 | $1,565 |

### Leg 2 — Couple, workation → Siem Reap, Thu 24 Dec (2 adults)

| From | Best verified option(s) | Arrive SAI | Total for 2 |
|---|---|---|---|
| **BKK** | **Six nonstops:** TG588 07:45, PG903 07:55, PG905 11:20, PG907 17:25, KR722 17:50, EK370 19:50 | 08:45 – 21:10 | $280 (EK) – $648 |
| **HKT** | Self-built: PG270 07:45 → BKK 09:20 + PG905 11:20 (2h connection, two V1 legs on separate tickets) | 12:40 | $854 |
| HKT | TG212 + EK370, single ticket | 21:10 | $622 |
| HKT | PG274 + EK370, single ticket | 21:10 | $512 |
| HKT | FD612 nonstop 14:30 → 16:05, if operating Thursday (V2/U) | 16:05 | — |
| **KUL** | MH758 + VN813 via SGN (4h00) | 17:40 | $834 |
| KUL | TG420 + PG905 via BKK | 12:40 | $1,271 |
| KUL | MH782 + PG907 | 18:45 | $983 |
| **SIN** | SQ166 nonstop, **Business only** | 16:00 | $2,362 |
| SIN | TG402 + PG905 | 12:40 | $1,738 |
| SIN | TG404 + PG907 | 18:45 | $1,334 |
| SIN | SQ184 + VN813 via SGN | 17:40 | $1,850 |
| **LPQ** | VN931 nonstop 14:35 | 16:10 | $483 |
| LPQ | QV513 direct via Pakse 08:30 | 11:50 | $469 |
| **KOS** | K6130 nonstop 11:05 | 12:10 | $292 |
| **PQC** | VN1824 + VN813 via SGN | 17:40 | $487 |
| PQC | VN1832 + VN815 via SGN (4h55) | 20:30 | $457 |
| **USM** | PG162 + EK370 (4h05) | 21:10 | $635 |
| **CNX** | TG111 + EK370 (5h45) | 21:10 | $896 |
| CNX | TG107 + EK370 | 21:10 | $602 |
| **DPS** | VN640 + K6829 via SGN (6h40) | 21:45 | $634 |
| **KBV** | TG246 + EK370 (8h25) | 21:10 | $903 |
| **LGK** | Two-stop only: MH + MH + VN (6h45) | 20:30 | $920 |
| **PEN** | Two-stop only | 17:40 | $920 |
| DMK | Thai AirAsia (V2, not on Expedia) | — | U |

Observations:
- Outside Bangkok, almost every Expedia-built connection to SAI funnels into **EK370**, the last flight of the day (21:10 arrival).
- Morning arrivals need either BKK as the workation base, or a self-built feeder into PG903/PG905 at Suvarnabhumi.

### Family (grandparents + children 9 and 7) Hyderabad ↔ Siem Reap

**Outbound (all V1):**

| # | Itinerary | Times | Ticketing | Total for 4 | Per person | Verdict |
|---|---|---|---|---|---|---|
| 1 | **IndiGo via Kolkata:** 6E2257 HYD (Wed 23 Dec) → CCU (3h40) → 6E1655 | 21:50 → **08:00 Thu 24** | Single | **$1,432** | about $358, Flexi, 1 checked bag | Cheapest and earliest. Full overnight red-eye with children; IndiGo was suspended Jul–Sep 2026 and flies only 3x weekly. |
| 2 | **Thai/Bangkok Airways via BKK:** TG330 HYD 01:30 (night of Wed 23) → BKK 06:30 → PG903 07:55 | 01:30 → **09:15 Thu 24** | Single, Flexi 2×23 kg, refundable with fee | **$2,200.24** | Adult $581.31, child $518.81 | Full-service. 1h25 BKK connection is protected on one ticket; PG905 at 11:20 is the fallback. **Best value full-service option.** |
| 3 | TG330 + TG588 | 01:30 → 08:45 | Single, Full Flexi | $2,588.64 | | All on Thai, 1h15 connection |
| 4 | **TG330 + PG905** | 01:30 → **12:40** | Single, Full Flexi | $2,821.84 | Adult $747.71, child $663.21 | 4h50 wait at BKK. **Use this for the hub meeting (below).** |
| 5 | TG358 HYD 16:35 Wed 23 → overnight at BKK → PG903 | → 09:15 Thu 24 | Single | $2,049.04 | | Overnight layover; needs an airside or hotel plan |

**Return Mon 28 Dec (all V1):**

| Itinerary | Times | Ticketing | Total for 4 |
|---|---|---|---|
| **6E1656 SAI → CCU (4h20) → 6E6908 → HYD** | 09:00 → **17:15** | Single | **$1,196** (adult $302, child $296) |
| PG908 + TG329 via BKK (1h connection) | 19:25 → 23:55 | Single, Full Flexi | $2,742.80 |
| TG589 + TG329 (10h55 at BKK) | 09:50 → 23:55 | Single | $2,318.80 |
| PG924 + AI2353 + AI2869 via BKK and BOM | 09:55 → 23:05 | Single | $1,610 |

**Recommendation for the family:**
- **Outbound — recommended:** option 2, TG330 + PG903 ($2,200). Full-service with two bags each, and the airline protects the connection.
- **Outbound — budget alternative:** option 1, IndiGo via Kolkata ($1,432), if the red-eye is acceptable. Keep option 2 as the plan B if IndiGo re-times or cancels.
- **Return:** IndiGo via Kolkata ($1,196) is the only daytime same-day option.

### Hub meeting — couple and family share the final flight into SAI on Thu 24 Dec
Kolkata (IndiGo) cannot sensibly be a meeting point. **Bangkok Suvarnabhumi is the only practical hub.** Specific matches:

**H1 — PG905 BKK 11:20 → SAI 12:40 (recommended meeting flight)**
- **Family:** TG330 HYD 01:30 → BKK 06:30, then PG905. Single ticket, $2,821.84 (V1).
- **Couple, from Phuket:** PG270 HKT 07:45 → BKK 09:20, then PG905. Two separate Expedia tickets: $102.90 + $324.10 = $427 per person, $854 for 2 (two V1 legs; the combination is E). Try to book both on bangkokair.com as one PNR; otherwise it is a self-transfer with a 2h buffer.
- **Couple, from Singapore:** TG402 SIN 08:15 → BKK 09:35, then PG905. Single ticket, $869.20 per person / $1,738.40 (V1).
- **Couple, from Kuala Lumpur:** TG420 KUL 08:00, then PG905. Single ticket, $635.30 per person / $1,270.60 (V1).
- **Couple, from Bangkok:** PG905 alone, $324.10 per person (V1).
- **Downside:** costs about $620 more for the family than PG903.

**H2 — PG903 BKK 07:55 → SAI 09:15 (cheapest for the family)**
- Family on TG330 + PG903 ($2,200.24).
- The couple must already be in Bangkok that morning, which suits a Bangkok workation. PG903 costs $226.10 per person (V1). No feeder from HKT, SIN or KUL reaches BKK by 07:55 except by overnighting in BKK on the 23rd.

**H3 — TG588 BKK 07:45 → SAI 08:45**
- Same logic as H2, all on Thai. Family $2,588.64; couple TG588 $322.10 per person (V1).

**H4 — PG907 BKK 17:25 → SAI 18:45 (not recommended for the family)**
- The family would sit through a 10h55 BKK layover on TG330 + PG907 ($2,445.84).
- Couple options: SIN TG404 + PG907 ($667.20 per person); KUL MH782 + PG907 ($491.70 per person); LGK MH1433 + MH782 + PG907 ($529.80 per person) (all V1).

**H5 — EK370 BKK 19:50 → SAI 21:10**
- The couple has single tickets from HKT, USM, CNX or KBV via EK370 (V1).
- The family would need 6E1509 HYD 09:20 → BKK 14:30 (V1 on Dec 18 only; E for Dec 24) as a separate ticket. Arrival at 21:10 is late for the children.

**Bottom line:** if the workation is Bangkok, use H2 or H3. If it is Phuket, Singapore or KL, use H1 on PG905 (12:40 arrival).

### Phase 3 — couple, Mon 28 Dec → home by Thu 31 Dec (2 adults)

| Option | Out (Mon 28 Dec) | Back to HYD (Thu 31 Dec) | Total for 2 | Comment |
|---|---|---|---|---|
| **A. Return with the family** | 6E1656 + 6E6908 SAI 09:00 → HYD 17:15 | — | **$538** | Simplest; same flights as the family |
| **B. Bangkok (best)** | TG589 09:50 → 10:55 ($479.40); KR721 12:10 → 13:40 ($425.60); PG924/906/908 ($859.40) | 6E1510 BKK 15:30 → 17:50 nonstop ($436); TG329 21:50 → 23:55 ($557.20) | about $862–1,036 | TG329 lands 5 minutes before midnight; prefer 6E1510 |
| **C. Phuket** | TG589 + TG215 via BKK, arrive 16:30 ($811.40); SQ163 + SQ736 via SIN ($1,328.80). FD613 16:50 nonstop is V2/U for Monday. | 6E1258 + 6E5386 via BOM, 08:55 → 16:35 ($636) | about $1,447 | No HKT–HYD nonstop returned for Thu 31 Dec |
| **D. Phu Quoc** | SQ163 + SQ8648 via SIN, arrive 17:55 ($1,037.40); or overnight VN via SGN ($429) | VJ326 + VJ1803 via SGN, 14:20 → 22:35 ($656) | | Weak |
| **E. Langkawi** | Two-stop via SIN (50-minute connection) and KUL, arrive 19:30 ($996.80) | MH1455 + MH198 via KUL, arrive 23:20 ($912) | | Weak |
| **F. Krabi** | TG589 + TG249, 9h50, arrive 19:40 ($1,213.40) | KBV→HYD not searched | U | Weak |

---

## C. Connectivity scores (1–10)
Columns: (a) Singapore → destination on Fri 18 Dec; (b) Hyderabad → destination on Fri 18 Dec, overnight Dec 17 departures counted; (c) destination → SAI on Thu 24 Dec.

| Dest | (a) SIN→ | (b) HYD→ | (c) →SAI Thu 24 | Sum /30 | Justification |
|---|---|---|---|---|---|
| **BKK** (incl. DMK) | 10 | 10 | 10 | **30** | (a) Many nonstops on TG, SQ and Scoot. (b) Three HYD nonstops (TG330, 6E1509, TG358). (c) Six SAI nonstops from 07:45 to 19:50 on four carriers, plus Thai AirAsia from DMK; it is also the hub-meeting point. |
| **KUL** | 10 | 8 | 6 | 24 | (b) Only one nonstop, MH199 at 00:30. (c) No nonstop: MH via SGN arrives 17:40; TG + PG905 arrives 12:40; AirAsia/Firefly unavailable or halted. |
| **HKT** | 9 | 8 | 7 | 24 | (a) Scoot ×3 and SQ740 nonstop. (b) IX976 nonstop, but 2026 frequency is unclear. (c) No nonstop on Expedia; the self-built PG270 + PG905 arrives 12:40; single tickets only via EK370 at 21:10. Rises to 8–9 if FD612 is confirmed for Thursdays. |
| **USM** | 9 | 6 | 6 | 21 | (a) PG ×2 and Scoot ×4 nonstops, but expensive. (b) Only TG330 + PG via BKK, Flexi at $610 per person. (c) Only the evening EK370 arrival is verified; a morning PG feeder is plausible but U. |
| **CNX** | 8 | 7 | 5 | 20 | (a) Scoot nonstops only. (b) TG330 + TG102 with a 55-minute connection. (c) Only EK370 21:10 arrivals, 5h45+. |
| **DPS** | 10 | 6 | 4 | 20 | (a) Excellent. (b) No nonstop; 9h+ via KUL or BKK. (c) Best is 6h40 arriving 21:45; otherwise two-stop or overnight. |
| **KBV** | 8 | 7 | 4 | 19 | (a) Scoot only. (b) 5h55 via BKK with a 1h05 connection. (c) No direct; best single ticket 8h25 arriving 21:10. |
| **PEN** | 9 | 6 | 3 | 18 | (a) SQ and Scoot nonstops. (b) Via BKK or MAA. (c) Two-stop only. |
| **LGK** | 8 | 6 | 3 | 17 | (a) Scoot nonstops. (b) Via KUL from 00:30. (c) Two-stop only, 6h45+, nonrefundable. |
| **SIN** (stay in SIN) | n/a | 9 | 5 | 14 + home | (b) Three HYD nonstops. (c) SQ166 nonstop exists, but only Business ($1,181 per person) was offered; economy connections cost $667–925 per person. |
| **PQC** | 8 | 3 | 6 | 17 | (a) VietJet, 9G and Scoot nonstops. (b) No same-day option under 12h. (c) One stop via SGN on a single VN ticket, 4h55–5h35. |
| **LPQ** | 4 | 4 | 9 | 17 | (a)/(b) No nonstop; 6–10h+ and expensive. (c) VN931 nonstop 14:35 → 16:10 and QV513 08:30 → 11:50. |
| **KOS** | 1 (U) | 1 | 9 | 11 | (a) Expedia found nothing. (b) 24h+. (c) K6130 nonstop 11:05 → 12:10. |

**Reading:**
- **Bangkok is the only destination with no weak leg.** It works from both Singapore and Hyderabad, it is the hub-meeting point, and it is the best Phase 3 base (6E1510 home on Dec 31).
- **Phuket** is the best beach option. It is clearly weaker on Dec 24 unless the Thai AirAsia FD612 nonstop is confirmed for Thursday, or the self-built PG270 + PG905 transfer is accepted.
- **Avoid on connectivity grounds:** Langkawi, Penang, Krabi, Bali, Phu Quoc (from Hyderabad), Luang Prabang and Sihanoukville (getting there).

---

## D. Risks and connection notes
1. **BKK vs DMK.** Thai AirAsia (DMK–SAI) and the Lion and Nok HKT–DMK flights use Don Mueang. TG, PG, KR and EK use Suvarnabhumi. A cross-airport transfer takes 1–1.5h by road on separate tickets; never plan a same-day DMK↔BKK connection with the children.
2. **Self-transfer PG270 + PG905 (HKT → BKK → SAI).** Separate tickets, so no protection if PG270 is late. PG270 is nonrefundable, with a THB 1,400 change fee. The 2h buffer is reasonable for a domestic-to-international transfer at Suvarnabhumi (E), but bags must be collected and re-checked unless PG through-checks them. Ask Bangkok Airways for a single ticket.
3. **Family's 1h25 TG330 → PG903 connection.** International-to-international on one ticket, so the airline protects it, but it is tight for two grandparents and two children after an overnight flight. Ask for bags to be checked through to SAI and for assistance if needed. Fallbacks the same day are PG905 (11:20) and PG907 (17:25).
4. **IndiGo CCU–SAI reliability.** The route was paused Jul–Sep 2026 for demand and fuel reasons and runs only Mon/Thu/Sat. A cancellation means no alternative that same day. CCU connections:
   - Outbound: clear emigration at CCU at night.
   - Return: arriving at CCU, the family must clear immigration and customs and re-check bags to the domestic flight. The 4h20 layover is adequate.
   - Overnight travel with children.
5. **EK370 is a tag flight from Dubai.** Delays from the Gulf leg carry into the BKK–SAI leg. The 21:10 arrival is the latest of the day, with no later backup.
6. **Christmas Eve demand.** SQ166 economy was already unavailable for 2 passengers. Bangkok Airways showed only 2–4 seats left on several flights. Book early.
7. **LCC baggage traps.** These fares exclude checked bags: Scoot Basic, Air India Express Lite, Jetstar Starter, KLM Light. The Sun PhuQuoc fare excludes carry-on too, per Expedia. Bangkok Airways allows 20 kg; Thai Standard 1×23 kg; Thai Flexi 2×23 kg.
8. **Thailand–Cambodia political risk.** The land border has been closed since late June 2025. A ceasefire on 27 Dec 2025 reportedly broke down in January 2026 (blog). Air links have stayed open: the Cambodian civil aviation authority counted 270 flights a week in Feb 2026, 118 of them on SAI–BKK–HKT, and Khmer Times reports flights "uninterrupted". An older report of a Thai ban grounding Emirates' Siem Reap flights appears superseded, since EK370 is on sale. Check government advisories near departure. The US advisory is Level 4 within 50 km of the border, which does not affect Siem Reap town or the airport routes.
9. **Expedia data gaps.** Partial result sets, LCCs missing, and a "2027" date label on Dec 28/31 results (see the top of this file).
10. **TG329 on Dec 31** lands at 23:55; any delay misses the "home by Thu 31" target. Prefer 6E1510 (lands 17:50).

## E. Items needing confirmation before booking
- Thai AirAsia FD612 HKT–SAI: which weekdays it runs in Dec 2026, especially Thu 24 Dec (airasia.com).
- Thai AirAsia DMK–SAI timings for 24 Dec, if Bangkok is chosen and an LCC is acceptable.
- IndiGo 6E1655/6E1656: still scheduled for 24 and 28 Dec close to departure, and exact CCU times. CCU departure about 03:45 is derived (E).
- Whether Bangkok Airways will sell PG270 + PG905 as one ticket.
- Air India Express IX976/IX975 HYD–HKT operating days in December.
- SQ SIN–SAI: economy availability on 24 Dec, and whether SQ164 (morning) also operates on Thursdays.
- Child fares on BKK–SAI single segments (EK370, PG903) for any self-transfer plan. Only adult fares were searched.
- KBV→HYD on Dec 31 (not searched).
- Entry and transit documents: Cambodia e-visa or visa on arrival for Indian passports, and Thai transit or visa-exemption status in Dec 2026 for any self-transfer or overnight at BKK. Not researched here.

## F. Sources
**Live data:** Expedia `search_flights`, 2026-10-21. Over 60 queries; each row in `flights.csv` is marked V1.

**Web sources:**
- SAI airport: https://en.wikipedia.org/wiki/Siem_Reap%E2%80%93Angkor_International_Airport ; https://opendevelopmentcambodia.net/news/siem-reap-angkor-international-airport-to-officially-open-on-oct-16-confirms-ssca/ ; https://www.flightconnections.com/flights-from-siem-reap-sai ; https://www.flightradar24.com/data/airports/sai
- IndiGo CCU–SAI: https://centreforaviation.com/news/indigo-to-resume-services-from-kolkata-to-shanghai-singapore-and-siem-reap-from-oct-2026-1372434 ; https://goasia.cc/en/news/indigo-suspends-kolkata-siem-reap-flights-july-2026 ; https://cambodianess.com/article/indigo-to-restore-kolkata-siem-reap-flights ; https://www.goindigo.in/press-releases/indigo-commences-direct-flights-between-kolkata-and-siem-reap.html ; https://aseannow.com/topic/1397459-indigo-and-firefly-halt-siem-reap-flights/
- Emirates EK370: https://www.cambodgemag.com/en/post/tourisme-transports-emirates-expands-asian-network-with-dubai-siem-reap-route ; https://themangoroad.com/?p=4809
- Singapore–SAI and Jetstar Asia: https://www.directflights.com/SIN-SAI ; https://secretsingapore.co/jetstar-asia-closure-in-singapore-after-20-years/ ; https://www.ch-aviation.com/news/154948-singapore-airlines-group-to-take-on-jetstar-asia-routes ; https://www.nst.com.my/amp/business/corporate/2025/06/1230024/singapore-airlines-scoot-take-over-jetstar-routes
- Thai AirAsia: https://www.directflights.com/DMK-SAI ; https://www.skyscanner.ch/flug-tracker/thai-airasia/fd615 ; https://www.aeroroutes.com/eng/260923-fdnw26int ; https://thethaiger.com/news/world/aviation/airasia-restores-10-asian-routes-for-2026-high-season ; https://deeparrival.com/news/thai-airasia-53-routes-high-season-2026/ ; https://www.explera.co.th/blog/2026-09-23-thailand-airasia-high-season-route-restorations-agent-guide/ ; https://info.flightmapper.net/route/YY_HKT_SAI ; https://www.aeroroutes.com/eng/261016-fd1q27sai ; https://www.directflights.com/HKT-SAI ; https://www.flightsfrom.com/HKT-SAI
- Cambodia Airways: https://www.aeroroutes.com/eng/260901-krsep26sai ; https://aseannow.com/thailand-news/cambodia-airways-adds-siem-reap-bangkok-flights-r3675/ ; https://centreforaviation.com/news/cambodia-airways-commences-siem-reap-services-to-phnom-penh-and-sihanoukville-1364828
- Firefly: https://www.cambodgemag.com/en/post/firefly-airlines-opens-a-new-direct-route-to-siem-reap
- Bangkok Airways trackers: https://www.avionio.com/en/flight/pg-905 ; https://airconnect.live/en/airlines/bangkok-airways/flight-schedule
- Hyderabad routes: https://www.directflights.com/HYD-HKT ; https://www.flightsfrom.com/HYD-HKT ; https://bangkokpost.com/thailand/pr/2991976/%E2%80%93hyderabad-flights-to-six-weekly- ; https://happyfares.in/blog/hyderabad-rgia-international-direct-routes-2026/ ; https://www.thaiairways.com/flights/en-in/flights-from-hyderabad
- Thailand–Cambodia border: https://asianews.network/cambodia-thailand-air-corridor-still-open-270-flights-per-week/ ; https://www.khmertimeskh.com/501706965/cambodia-thailand-flight-operations-remain-uninterrupted-amid-full-land-border-closures/ ; https://thethaiger.com/travel/thailand-travel/planning-a-thailand-trip-in-2026-heres-what-the-border-conflict-with-cambodia-means-for-you ; https://www.explera.co.th/blog/2026-08-26-thailand-cambodia-land-border-closed-agent-guide/ ; https://cambodiakingdom.com/getting-here/thailand-cambodia-border

WebFetch failed with DNS errors on aeroroutes.com and thethaiger.com (one attempt each). Their content above comes from search-result summaries.
