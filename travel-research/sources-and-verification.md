# Sources, verification and open questions

All evidence was retrieved on **21 Oct 2026**.

**Confidence codes**
- **V1:** live inventory (Expedia) or an official source.
- **V2:** credible secondary source; where possible dated within 12 months.
- **E:** estimate.
- **U:** unknown.

Raw research, with every source link, is in `raw/`: `destinations.md`, `flights.md` and `flights.csv`, `hotels-andaman.md`, `hotels-cities.md`, `hotels-other.md`, `siem-reap.md`. Price records are kept apart: `prices-verified.csv` holds V1 prices only, and `prices-estimated.csv` holds E prices only.

## 1. Tool limits that shape the evidence
- **WebFetch and direct HTTP failed** (DNS or egress blocked) for these sites. They were tried once each and not retried:
  - Booking.com, Agoda, Trip.com, Kayak, Google, Marriott.com, Hilton.com
  - hotel websites (comohotels.com, fourseasons.com, sixsenses.com)
  - aeroroutes.com, thethaiger.com, tripadvisor.com, evisa.gov.kh, angkorenterprise.gov.kh, pharecircus.org
- Facts from those sites come from **search-result snippets**, so they are graded V2 even when the site is official.
- **Expedia** was the only live inventory reachable. Its limits:
  1. It shows the cheapest room for the party size, never a named category.
  2. It doesn't sell Thai AirAsia or AirAsia.
  3. Some nonstops (SQ740, TG329) appear only with an airline filter.
  4. Results for 28 and 31 Dec carry a "2027" display label even though the returned departure date is 2026.
- **A search that returns nothing is recorded as U, not "unavailable".**

## 2. Key claims and their evidence

| # | Claim used in the report | Evidence | Grade |
| --- | --- | --- | --- |
| 1 | Andaman coast (Phuket/Krabi) is dry and calm in December; about 50–110 mm of rain | [phuket101](https://www.phuket101.net/phuket-weather-in-december/), [TUI](https://www.tui.co.uk/holidays/weather/asia/thailand/thailand/phuket/december.html), [WeatherSpark](https://weatherspark.com/m/149059/12/Average-Weather-in-December-at-Phuket-International-Airport-Thailand) | V2; sources differ by up to 2× |
| 2 | Singapore: December averages 331.9 mm and 19 rain days | [NEA](https://www.nea.gov.sg/media/news/advisories/index/wet-weather-to-continue-for-rest-of-december-2025) | V1 |
| 3 | Bali is in its wet season; Ubud is wettest | [bali.com](https://bali.com/travel-guide/weather-by-month/weather-december/) | V2 |
| 4 | Koh Samui is at the tail of the Gulf monsoon in December | [WeatherSpark](https://weatherspark.com/m/112991/12/Average-Weather-in-December-in-Ko-Samui-Thailand), [Kuoni](https://www.kuoni.co.uk/thailand/koh-samui/best-time-to-visit) | V2 |
| 5 | Thailand gives Indian passport holders 30 days visa-free from 15 Sep 2026; TDAC is mandatory | [Thai Embassy New Delhi](https://newdelhi.thaiembassy.org/en/content/latest-update-on-revision-to-thailand-s-visa-exemp) (snippet), [AIR](https://newsonair.gov.in/thailand-allows-visa-free-entry-and-stay-up-to-30-days-for-indian-tourists/) | V1/V2. Changed three times in 2026 |
| 6 | Malaysia gives Indian passport holders visa-free entry until 31 Dec 2026, plus MDAC | [EY](https://www.ey.com/en_gl/technical/tax-alerts/malaysia-extends-visa-exemption-period-for-india-and-china-nationals) | V2 |
| 7 | Remote work isn't explicitly authorised on tourist entry in Thailand | [ISSA Compass](https://www.issacompass.com/insights/working-remotely-from-thailand-legally-which-visa-actually-covers-your-situation) | V2; no government text retrieved |
| 8 | Mobile median speed is 167 Mbps in Bangkok and Phuket (Ookla Q2 2026) | [seasia.co](https://seasia.co/2026/09/16/southeast-asian-cities-with-the-fastest-mobile-internet-speeds-update-2026) | V2 |
| 9 | Six BKK–SAI nonstops on Thu 24 Dec (TG588, PG903, PG905, PG907, KR722, EK370) | Expedia search_flights | V1 |
| 10 | Thai AirAsia FD612 Phuket → SAI (14:30 → 16:05) resumed 25 Oct 2026; days conflict | [Thaiger](https://thethaiger.com/news/world/aviation/airasia-restores-10-asian-routes-for-2026-high-season), [AeroRoutes](https://www.aeroroutes.com/eng/260923-fdnw26int), [flightmapper](https://info.flightmapper.net/route/YY_HKT_SAI) | V2. **Thursday operation U** |
| 11 | Jetstar Asia shut on 31 Jul 2025; Singapore Airlines is the only SIN–SAI carrier | [Secret Singapore](https://secretsingapore.co/jetstar-asia-closure-in-singapore-after-20-years/), Expedia | V2 + V1 |
| 12 | IndiGo Kolkata–SAI runs Mon/Thu/Sat and resumed 1 Oct 2026 after a Jul–Sep pause | Expedia (6E1655 on 24 Dec, 6E1656 on 28 Dec); [CAPA](https://centreforaviation.com/news/indigo-to-resume-services-from-kolkata-to-shanghai-singapore-and-siem-reap-from-oct-2026-1372434) | V1 + V2 |
| 13 | The Thailand–Cambodia air corridor stays open despite the land-border closure | [Asia News Network](https://asianews.network/cambodia-thailand-air-corridor-still-open-270-flights-per-week/), [Khmer Times](https://www.khmertimeskh.com/501706965/cambodia-thailand-flight-operations-remain-uninterrupted-amid-full-land-border-c) | V2 |
| 14 | Four Seasons Bangkok Executive Suite: about 110 m², separate bedroom, desk; property reports 100+ Mbps | [Hotels.com listing](https://widgets.hotels.com/ho1168242624/four-seasons-hotel-bangkok-at-chao-phraya-river-bangkok-thailand) | V2; speed is property-reported, not measured |
| 15 | Four Seasons Bangkok one-bedroom suites "from USD 1,400++" | [Glass Magazine](https://theglassmagazine.com/glass-stays-in-an-urban-oasis-at-the-four-seasons-bangkok/) | V2, undated, so treated as E for pricing |
| 16 | Capella suites are 95–209 m² with separate living rooms; the entry Riverfront Premier is 61 m² | [Capella](https://capellahotels.com/en/capella-bangkok/accommodation), [The National, Jul 2026](https://www.thenationalnews.com/travel/2026/07/24/capella-bangkok-review-thailand-chao-phraya-river/) | V1/V2 |
| 17 | Rosewood Bangkok Manor Suite: about 79 m² with a separate living room | [Remote Lands](https://www.remotelands.com/hotel/rosewood-bangkok) | V2 |
| 18 | Trisara Signature Ocean View Pool Suite: about 230 m² with a separate living area; PRU is Michelin-starred | [Expedia listing](https://www.expedia.com/Phuket-Hotels-Trisara-Villas-Residences-Phuket.h1096979.Hotel-Information), [Michelin](https://guide.michelin.com/at/de/article/travel/trisara-39-villen-luxus-und-naturverbundenheit-in-phuket) | V2 |
| 19 | COMO Suite: 300 m² with separate living and dining areas | [COMO FAQ](https://www.comohotels.com/thailand/como-point-yamu/about/faq) | V1 (snippet) |
| 20 | Phu Quoc construction peaks before APEC 2027 (deadline 31 May 2027) | [Viet Nam News](https://vietnamnews.vn/society/1800651/phu-quoc-races-to-complete-apec-2027-infrastructure.html) | V2 |
| 21 | Park Hyatt Phu Quoc opens 1 Mar 2027, despite an Expedia price | Raw `hotels-other.md` (OMAAT, InsideFlyer) | V2 |
| 22 | Cambodia: e-visa about $36 (US$30 fee + US$6 processing) or visa on arrival; e-Arrival card mandatory | [visa2fly](https://visa2fly.com/blog/Cambodia-Visa-for-Indians), [Singapore MFA](https://www.mfa.gov.sg/Countries-Regions/C/cambodia/travel-page) | V2. Fee conflicts ($30 vs $36) |
| 23 | Angkor Pass: $37 / $62 / $72; under-12s free with passport | [helloangkor](https://helloangkor.com/angkor-ticket-prices/), [adventurescambodia](https://adventurescambodia.com/blog/angkor-wat-tickets/) | V2 |
| 24 | Angkor foreign arrivals down 27.6% (Jan–Sep 2026) | [The Star](https://www.thestar.com.my/aseanplus/aseanplus-news/2026/10/12/cambodia039s-angkor-tourism-expected-to-rebound-as-kingdom-spares-no-effort-to-end-online-scams) | V2 |
| 25 | Phare Circus: 17:00 matinee on Wed/Fri/Sun, Nov 2026 – Mar 2027 | [Phare](https://pharecircus.org/schedule-rates/) (snippet) | V2 |
| 26 | Tammang (100% plant-based) is MICHELIN Selected 2026 | [press release](https://www.barchart.com/story/news/3301024/tammang-thailands-first-michelinrecognized-vegan-restaurant-brings-plantbased-isaan-cuisine-to-bangkok) | V2 (promotional) |

## 3. Conflicts and how they were resolved
- **FD612 Phuket → SAI frequency:** flightmapper says daily from 25 Oct; AeroRoutes says 4× weekly Jan–Mar 2027. AeroRoutes is generally more reliable on schedules, so Thursday operation is treated as **U**. The recommendation doesn't depend on FD612.
- **Thai visa exemption:** 60 days, then a proposed 15-day visa on arrival, then 30 days from 15 Sep 2026. The embassy and Royal Gazette timing outranks an insurer's blog.
- **Trisara Wi-Fi:** "stable, fast" (2022) vs "better in the car" (undated). Resolved only by asking the hotel for a speed test; this matters only for the Phuket-only option.
- **Cambodian e-visa fee:** $30 (government fee) vs $36 (fee plus processing). The report uses $36 to be safe.
- **Langkawi December rain:** "best beach month" vs about 55% rainy days. Treated as "showers likely".
- **Phu Quoc's Bai Khem (JW Marriott) sea state:** "calm" (undated) vs "NE-monsoon swell Nov–Mar". Treated as a risk.

## 4. Audit of major claims (checked against the raw files)
- The Expedia prices quoted in the report match `prices-verified.csv` and the raw files.
- Every flight time and fare in report section E matches a V1 row in `flight-options.csv`. The PG270 + PG905 combination is two V1 legs combined by hand, labelled E.
- The scoring numbers in report sections B, C and I are reproduced by `python3 scoring/score.py`.
- **Corrected during the audit:** an early draft called $2,213 the Rosewood Manor Suite price. It is Rosewood's cheapest room, and the report now says so.

## 5. Unresolved: confirm directly before booking
1. **Four Seasons Bangkok:** Executive Suite rate and availability for 20–24 Dec; whether the bedroom and living room are separated by a door; Wi-Fi speed test from the suite; wired Ethernet; second desk chair; breakfast; cancellation terms.
2. **Capella Bangkok:** Riverfront Suite rate for the same dates (this decides the switch rule).
3. **Trisara:** which category the $4,648 rate covers; festive minimum stay; whether a vegetarian PRU menu can be booked.
4. **Siem Reap hotel:** Sofitel family configuration (what the $3,955 "2+2" unit is) plus a guaranteed connecting room; compulsory Christmas Eve gala supplement.
5. **Flights:** whether Bangkok Airways will put the couple and family on one PNR (optional); IX976 December operating days if flying from Hyderabad; IndiGo 6E1655 and 6E1656 still scheduled closer to departure.
6. **Entry:** couple's nationality and residence (assumed Indian passports); Thai rules re-checked a week before; Cambodian e-visa valid at SAI.
7. **Siem Reap:** whether under-12s may climb Angkor Wat's upper level (Bakan); whether the Angkor balloon runs in 2026; private guide quotes.
8. **Thailand–Cambodia relations:** check government advisories in December.

## 6. Assumptions
- The couple and family hold Indian passports. The couple may live in Singapore, but that gives no visa waivers elsewhere (V2).
- "Luxury" means 5-star or ultra-luxury, with a two-room unit for workdays.
- Fares and rates are as of 21 Oct 2026 and change daily.
