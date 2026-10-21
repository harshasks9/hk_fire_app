# December 2026 workation and Siem Reap family trip: research report

Prepared 21 Oct 2026 for a couple travelling from Singapore or Hyderabad. Phase 1 is a romantic workation, 18–24 Dec. Phase 2 is a family holiday in Siem Reap, 24–28 Dec. Phase 3, 28–31 Dec, is optional.

**How to read this report.** Every price and schedule carries a label:
- **V1:** live inventory (Expedia, retrieved 21 Oct 2026) or an official source.
- **V2:** a credible secondary source.
- **E:** my estimate.
- **U:** unknown; confirm it directly.

The full evidence log is in `sources-and-verification.md`. The scoring model is `scoring/score.py`.

> **Limits of this research.** This environment can't reach Booking.com, Agoda, Trip.com, Kayak, Google, Marriott.com, Hilton.com, the hotels' own sites or most airline sites. Live prices come from Expedia's search tools. Expedia shows the **cheapest available room**, not a named category, so every hotel price below is a **floor**. No hotel in the region has independent, measured Wi-Fi evidence, so internet quality is the biggest unknown in every option.

---

## A. Executive recommendation

**Spend the free weekend on a Phuket beach. Spend the three workdays in a riverside two-room suite in Bangkok.** On Thursday morning, fly to Siem Reap from Bangkok with the grandparents and children.

| | Weekend: Fri 18 – Sun 20 Dec (2 nights) | Workweek: Sun 20 – Thu 24 Dec (4 nights) |
| --- | --- | --- |
| Where | Phuket, north-west coast | Bangkok, Chao Phraya riverside |
| Hotel | **Trisara** | **Four Seasons Hotel Bangkok at Chao Phraya River** |
| Room | Entry pool suite (Expedia doesn't name it; a private pool suits a weekend with no work) | **Executive Suite, about 110 m², separate bedroom and living room, river view, desk listed** |
| Price | **$4,648** for 2 nights, taxes included (V1) | Entry room **$4,027** for 4 nights (V1). Executive Suite **about $6,600** (E, from a published "from USD 1,400++" one-bedroom suite rate; get a quote) |
| Why | Private cove, 39 villas, Michelin-starred PRU (plant-forward; ask for the vegetarian menu), 15–25 min from Phuket airport | Two closed rooms, so you can both take calls at once. It's the only shortlisted hotel with any published speed figure (property-reported 100+ Mbps). City-grade 5G backup. Bangkok is the Dec 24 hub |

**Expected Phase 1 cost for the couple:** about **$15,200 from Singapore** or **$14,900 from Hyderabad**, all in (details in section H). Swapping the weekend to **COMO Point Yamu** ($934 for 2 nights, V1) brings that to about **$11,500**.

**The strongest reasons**
1. **Each place does one job well.** Phuket's Andaman coast is at its driest and calmest in December, which suits a beach weekend. Bangkok gives the most dependable setup for two people on simultaneous calls: a two-room suite, city fibre and 5G (Bangkok mobile median 167 Mbps, Ookla Q2 2026, V2), and cafés and coworking spaces as fallback.
2. **Thursday becomes easy.** Bangkok has six nonstops to Siem Reap on Thu 24 Dec (V1).
   - The grandparents and kids can fly **TG330 + PG903** (Hyderabad 01:30 → Siem Reap 09:15, one ticket, $2,200 for four, V1).
   - You join them on **PG903** at 07:55 ($452 for two, V1) and land together at 09:15.
   - From Phuket you would leave at 06:00, self-transfer in Bangkok, and push the family onto a dearer flight (+$622).
3. **It's robust.** All six nights on one base in Bangkok scores 8.32 on your weights; this split scores 8.10, inside the model's margin of error. The split **wins when romance is weighted highest**. I recommend it because the brief is a *romantic* workation, and the split costs about the same as Bangkok-only once the weekend hotel is chosen well (section H).

**If you'd rather not change hotels on Sunday,** stay all six nights at the Four Seasons Bangkok in the Executive Suite. It wins four of the five weightings on its own (section I).

---

## B. Destination comparison

### Screening
I screened 17 places from scratch (details in `raw/destinations.md`). Eliminations:

| Eliminated | Rule | Evidence |
| --- | --- | --- |
| Singapore/Sentosa | Weather | 332 mm and 19 rain days in December, the wettest month (NEA/MSS normal, [NEA](https://www.nea.gov.sg/media/news/advisories/index/wet-weather-to-continue-for-rest-of-december-2025), V1). A visa is needed from Hyderabad |
| Bali | Weather, remote-work enforcement, connectivity | Wet season with about 22 rain days ([bali.com](https://bali.com/travel-guide/weather-by-month/weather-december/), V2); strictest enforcement of the set ([Emerhub](https://emerhub.com/bali/visas/remote-worker-visa/), V2); island-wide blackout in May 2025; best Denpasar → Siem Reap option is 6h40 arriving 21:45 (V1) |
| Da Nang/Hoi An, Nha Trang | Weather | Central-coast flood season; Hoi An flooded three times in November 2025 ([Vietnam Tourism](https://www.vietnamtourism.com/en/central-vietnam-floods-when-hoi-an-and-hue-flood-and-how-to-travel-through-it), V2) |
| Koh Samui | Weather | Tail of the Gulf monsoon: about 100–210 mm, wet-day chance 49% → 27% through December ([WeatherSpark](https://weatherspark.com/m/112991/12/Average-Weather-in-December-in-Ko-Samui-Thailand), V2). No nonstop to Siem Reap |
| Penang, Kuala Lumpur | Weather, romance | Wet NE monsoon; a weak romantic getaway |
| Luang Prabang | Connectivity, work infrastructure | 6–10 h from Singapore or Hyderabad; internet reports are mixed for video calls (V2) |
| Cambodian coast | Connectivity, unknowns | Sihanoukville is 24 h+ from Hyderabad and not on Expedia from Singapore; island Wi-Fi unknown |
| Siem Reap as the workation base | Duplicates Phase 2 | No travel on the 24th, but 10 nights in the same setting |

### Top five destinations (weighted score out of 10)
Weights: romance 25%, remote work 25%, hotel and room 20%, travel connectivity 20%, value 10%.

| Rank | Destination | Romance | Work | Hotel | Travel | Value | **Score** | Main strength | Main weakness | Flight connectivity (V1 unless noted) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Bangkok** | 6.5 | 8 | 9 | 10 | 9 | **8.32** | Work certainty; world-class riverside hotels; deep vegetarian scene (Michelin-listed vegan Tammang, V2) | No beach; temples and city feel overlap with Siem Reap | SIN: TG402, TG404, SQ720, Scoot nonstops. HYD: TG330, 6E1509, TG358 nonstops. To SAI on 24 Dec: six nonstops 07:45–19:50 |
| 2 | **Phuket** | 8 | 7 | 9 | 7.5 | 6 | **7.65** | Dry, calm Andaman beaches in December; deepest luxury inventory | Resort Wi-Fi unverified; Dec 24 needs a 07:45 self-transfer through Bangkok | SIN: Scoot ×3, SQ740. HYD: IX976 nonstop (2026 frequency conflicting). To SAI: PG270 + PG905 arrives 12:40; Thai AirAsia FD612 14:30 nonstop is listed but **not confirmed for Thursdays** (V2/U) |
| 3 | Chiang Mai | 7 | 7 | 8 | 5.5 | 7 | 6.90 | Cool, dry, cultural; strong vegetarian food | No beach; only the 21:10 EK370 arrival on Dec 24 | SIN: Scoot nonstops. HYD: via BKK. To SAI: via BKK, 5h45+ |
| 4 | Langkawi | 8 | 6 | 8 | 4 | 6 | 6.50 | Rainforest-beach resorts (Datai, Four Seasons) | December showers; to SAI is two-stop only (6h45+) | SIN: Scoot nonstops. HYD: via KUL from 00:30. To SAI: MH + MH + VN arrives 20:30 |
| 5 | Phang Nga Bay / Krabi | 9 | 5 | 7 | 5.5 | 5 | 6.50 | The most cinematic, secluded setting | Island and limestone Wi-Fi, boat transfers | Via HKT (+1h45 to Koh Yao Noi) or KBV (8h25 to SAI) |
| — | **Split plan: Phuket weekend + Bangkok workweek** | 8 | 8 | 9 | 8 | 7 | **8.10** | Beach romance when you're free; city reliability when you work; Bangkok hub on the 24th | One Sunday flight (HKT → BKK, 1h30) and two check-ins | As Phuket inbound, Bangkok outbound; TG212 HKT 16:05 → BKK 17:35 on Sun 20 Dec, $230 for two (V1) |

How I scored each criterion is in `scoring/` and the evidence is in the raw files. Unsupported attributes were held at or below 5–7, and confidence is labelled.

---

## C. Hotel comparison (12 properties, scored as a six-night single base)

Prices are Expedia totals for 18–24 Dec, 2 adults, taxes included, for the cheapest room (V1). The two-room category almost always costs more.

| Rank | Hotel and room for two workers | Size | Workspace evidence | Romance | Logistics | Expedia 6-night floor | Score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Four Seasons Bangkok: Executive Suite** | ~110 m² | Separate bedroom, desk and chair listed; **property-reported 100+ Mbps** (V2, not measured) | River gardens, spa | BKK 45–75 min; best Dec 24 options | $5,953 (suite est. ~$9,900, E) | **8.50** |
| 2 | **Capella Bangkok: Riverfront Suite** | 95–209 m² | Separate living room (Capella, V1/V2); Wi-Fi U | Highest in the city; every room faces the river | as above | $9,813 (one-bedroom River Suite about $2,411/night in an April 2026 snapshot, V2) | **8.43** |
| 3 | Rosewood Bangkok: Manor Suite | ~79 m² | Separate living room (V2); Wi-Fi U | CBD tower, no river | BKK 35–60 min | **$2,865** | 7.88 |
| 4 | Trisara: Signature Ocean View Pool Suite | ~230 m² | Separate living area (V2); Wi-Fi reports conflict | Private cove, Michelin PRU | HKT 15–25 min | $11,327 | 7.60 |
| 5 | COMO Point Yamu: COMO Suite | 300 m² | **Separate living and dining (official FAQ, V1)**; Wi-Fi U | Bay views, no beach | HKT 30–40 min | **$3,270** | 7.40 |
| 6 | Four Seasons Chiang Mai: One-Bedroom Residence | 244 m² | Separate living room (V1); rural Wi-Fi U | Rice-paddy valley | CNX 30–40 min; weak Dec 24 | Not returned | 7.15 |
| 7 | The Datai Langkawi: One-Bedroom Beach Villa | 350 m² | Separate living/dining (V1); only Wi-Fi report is from 2014 ("hit and miss") | Rainforest bay | LGK 40 min; two-stop to SAI | Not returned | 7.10 |
| 8 | Sri Panwa: One-Bedroom Pool Villa | conflicting 140–250 m² | A guest used the living room as an office (V2) | DJ/pool-club scene | HKT 50–70 min | $2,974 | 6.95 |
| 9 | Anantara Layan: Sala Pool Villa | 220 m² | Separate sitting area (V2) | Beach, quiet | HKT 15–25 min | $12,994 | 6.90 |
| 10 | Four Seasons Langkawi: Beach Villa with Plunge Pool | 220 m² | "Study spaces" in a review (V2) | Beach, mangroves | Two-stop to SAI | $6,900 | 6.88 |
| 11 | InterContinental Phuket: Two-Bedroom Pool Villa | ~260 m² | Separate sitting and dining areas (V2); Club Lounge as backup workspace | Big-resort feel | HKT 30–40 min | $5,767 | 6.85 |
| 12 | Rayavadee: Deluxe Pavilion | ~90 m², two floors | Lounge below, bedroom above (V2/E); limestone signal risk | Cinematic beach | KBV + 20-min boat | Not returned | 6.50 |

The full dataset is in `hotel-comparison.csv`. More than 30 other properties were screened and dropped; reasons are in the raw files. Notable drops:
- **Park Hyatt Phu Quoc** isn't open until 1 Mar 2027, even though Expedia shows a price.
- **The Andaman (Langkawi):** no evidence it has reopened after the 2021 fire.
- **Alila Villas Koh Russey** is no longer Alila; it's now "Koh Russey Resort".
- **Rosewood Phuket** returned $55,886, probably because only top villas were left.

---

## D. Top three deep dives

### 1. Four Seasons Hotel Bangkok at Chao Phraya River: Executive Suite (workweek base)
- **Room:** about 110 m², river view, separate bedroom, dining table. The listing includes a desk, desk chair, adapters and chargers ([Hotels.com listing](https://widgets.hotels.com/ho1168242624/four-seasons-hotel-bangkok-at-chao-phraya-river-bangkok-thailand), V2). One of you takes calls in the living room, the other at the bedroom desk with the door shut.
  - **Avoid the Studio Riverview Suite (77 m²).** It's open-plan.
- **Internet:** the property reports in-room Wi-Fi at "100+ Mbps, suits 1–2 people or up to 6 devices" (V2). It is **not independently measured**. Get a speed-test screenshot from an Executive Suite and ask whether there's a wired Ethernet port.
- **Evidence from reviews:** Expedia 9.8 from 389 reviews (V1). Independent reviews call it "a world-class urban resort" ([One Mile at a Time](https://onemileatatime.com/reviews/four-seasons-bangkok/); [Prince of Travel](https://princeoftravel.com/reviews/four-seasons-hotel-bangkok-at-chao-phraya-river/)). No negative pattern was found for 2025–26 (U: few detailed recent reviews retrieved).
- **Price:**
  - Entry rooms: $4,027 for 20–24 Dec (V1).
  - Suites: one-bedroom suites were published "from USD 1,400++ per night" ([Glass Magazine](https://theglassmagazine.com/glass-stays-in-an-urban-oasis-at-the-four-seasons-bangkok/), undated, V2). That's about $1,650 a night with 10% service and 7% VAT (E).
- **Vegetarian:** no published vegetarian menu (U). Next door, Capella's Côte by Mauro Colagreco "welcomes vegetarians" ([BK Magazine](https://www.bkmagazine.com/restaurants/bangkok-restaurant-reviews/cote-mauro-colagreco/), V2, 2022; it opened Wed–Sun then). Bangkok's plant-based scene is deep: Tammang (MICHELIN Selected 2026, 100% plant-based Isaan), Broccoli Revolution, Govinda, Veganerie (V2).
- **Drawbacks:**
  - The suite premium is unknown.
  - No private pool.
  - River-boat noise is possible (E).
  - 45–75 min to Suvarnabhumi in traffic, about 35–45 min at 05:30 (E).

### 2. Trisara, Phuket (weekend hotel; or the six-night beach alternative)
- **Room:** for the weekend, the entry pool suite or villa Expedia priced is enough. For a six-night stay with work, take the **Signature Ocean View Pool Suite**: about 230 m², with a separate living area and its own dining area ([Expedia listing](https://www.expedia.com/Phuket-Hotels-Trisara-Villas-Residences-Phuket.h1096979.Hotel-Information), V2).
- **Setting:** a private cove between Naithon and Layan with only 39 villas. PRU is Michelin-starred and plant-forward, though the Michelin write-up says the menu is "seafood and plants", so ask for a vegetarian menu ([Michelin Guide](https://guide.michelin.com/at/de/article/travel/trisara-39-villen-luxus-und-naturverbundenheit-in-phuket), V2).
- **Evidence:**
  - Expedia 9.8 from 177 reviews (V1).
  - Wi-Fi reports conflict: "stable, fast and free" ([Luxury Traveller, 2022](https://theluxurytraveller.com/2022/08/review-trisara-phuket/)) against "more reliable in the car on the way there" ([Dorsia, undated](https://dorsiatravel.com/review-trisara-phuket/)).
  - Whether the beach is good for swimming is disputed ([Roomer](https://www.roomertravel.com/featured/trisara.h90706)).
- **Price:** **$4,648 for 18–20 Dec** (V1); $11,327 for six nights at the entry level (V1). The Signature suite rate is U.
- **Drawbacks:**
  - Price.
  - A hillside layout, so you wait for buggies.
  - Dining off the resort needs a car.
  - The Wi-Fi conflict matters only if you also work here.

### 3. Capella Bangkok: Riverfront Suite (the alternative workweek base)
- **Room:** low-rise riverfront suites of 95–209 m² with separate living rooms and balconies ([Capella](https://capellahotels.com/en/capella-bangkok/accommodation), V1/V2). The entry Riverfront Premier (61 m², one room) **does not** work for two people on calls.
- **Evidence:**
  - Expedia 9.8 from 134 reviews (V1).
  - A July 2026 review puts the Riverfront Premier from THB 30,000 a night before tax ([The National](https://www.thenationalnews.com/travel/2026/07/24/capella-bangkok-review-thailand-chao-phraya-river/), hosted stay, V2).
  - A one-bedroom "River Suite" showed about $2,411 a night including taxes for an April 2026 date (Travelocity snapshot, V2).
- **Price:**
  - Entry rooms: $6,206 for 20–24 Dec (V1).
  - Riverfront Suite for 4 nights: probably **$9,000–10,000** (E).
- **Why it's second:** it's the most romantic hotel in the city, but at about 1.5× the Four Seasons suite cost for a similar work setup (E). See the switch rule in section J.

---

## E. Flight strategy

Fares are Expedia totals in USD, retrieved 21 Oct 2026 (V1), unless marked. The full table is in `flight-options.csv`.

| Leg | Recommended | Times (local) | Fare | Backup | Status |
| --- | --- | --- | --- | --- | --- |
| Couple, Singapore → Phuket, Fri 18 Dec | MH602 + MH786 via KUL | 06:20 → 09:50 | $852 for 2, 25 kg | SQ740 18:35 → 19:35 ($1,317 Flexi); Scoot TR658 08:40 → 09:40 ($1,100, no bag) | V1 |
| Couple, Hyderabad → Phuket, Fri 18 Dec | **AI6655 (= IX976) nonstop** | 06:15 → 11:40 | $571 for 2, 25 kg | 6E6364 + 6E1311 via BOM, 09:30 → 19:15 ($576) | V1 for 18 Dec; IX weekly frequency conflicts (V2) |
| Couple, Phuket → Bangkok, Sun 20 Dec | **TG212** | 16:05 → 17:35 | $230 for 2, 23 kg, refundable with fee | TG216 17:10, PG274 15:00, PG278 19:50 | V1 |
| Couple, Bangkok → Siem Reap, Thu 24 Dec | **PG903** | 07:55 → 09:15 | $452 for 2, 20 kg, nonrefundable | TG588 07:45 → 08:45 ($644, Flexi) | V1 |
| Grandparents + children, Hyderabad → Siem Reap, night of Wed 23 | **TG330 + PG903, one ticket** | 01:30 → BKK 06:30 → SAI 09:15 | **$2,200** for 2A + 2C, 2×23 kg | IndiGo 6E2257 + 6E1655 via Kolkata, 21:50 → 08:00 ($1,432; red-eye; route paused Jul–Sep 2026) | V1 |
| Everyone, Siem Reap → Hyderabad, Mon 28 Dec | **6E1656 + 6E6908 via Kolkata** | 09:00 → 17:15 | $1,196 family + $538 couple | PG908 + TG329 via BKK, 19:25 → 23:55 ($2,743 family) | V1. Expedia shows a "2027" label on these dates; check at booking |

**Notes**
- **The 1h25 TG330 → PG903 connection** is on one ticket, so it's protected; PG905 (11:20) and PG907 (17:25) are same-day fallbacks. Ask for bags to be checked through to SAI.
- **Singapore → Siem Reap:** only Singapore Airlines flies it; Jetstar Asia shut on 31 Jul 2025 (V2). SQ166 on 24 Dec showed Business class only ($1,181 per person).
- **India → Cambodia nonstop:** the only one is IndiGo Kolkata–SAI, Mon/Thu/Sat (V1 for 24 and 28 Dec).
- **Thailand–Cambodia:** the land border has been closed since mid-2025, but air links have kept running ([Asia News Network](https://asianews.network/cambodia-thailand-air-corridor-still-open-270-flights-per-week/), V2). The fallback if they stop is Vietnam Airlines via Ho Chi Minh City.
- **Book the Dec 24 seats first.** Bangkok Airways showed only 2–4 seats left on several flights.

---

## F. Six-night itineraries for the top three combinations

All times are local. Bangkok and Phuket are UTC+7, which is IST +1:30 and Singapore −1:00.

### Option 1 (recommended): Trisara weekend + Four Seasons Bangkok workweek
- **Fri 18:** land at HKT by 09:50 (from SIN) or 11:40 (from HYD), then 25 min to Trisara. Pool, a sunset swim in the cove, dinner at **PRU** (vegetarian tasting menu booked ahead).
- **Sat 19 (signature day):** a **private boat day in Phang Nga Bay**, leaving from Ao Po marina (about 35–40 min away, E): limestone karsts and sea-cave canoeing at the Hong islands, back by about 16:00. Sunset and dinner at the villa.
- **Sun 20:** slow breakfast, spa, beach. Leave at 14:45 for **TG212 at 16:05**, land at BKK at 17:35 and reach the Four Seasons around 19:00. Riverside dinner (Côte next door, if open on Sunday).
- **Mon 21 – Wed 23 (work, 09:00–18:00):** one of you in the living room, one at the bedroom desk. Morning river walk or gym.
  - **Mon:** spa, then dinner in the hotel.
  - **Tue:** a private longtail at sunset on the river and canals, 17:30–19:00, past Wat Arun lit up.
  - **Wed:** dinner at **Tammang** (plant-based, Michelin-listed; 30–45 min away), then pack.
- **Thu 24:** leave at 05:15, meet the family at the PG903 gate, land at SAI at 09:15 together.

### Option 2: Four Seasons Bangkok, all six nights
- **Fri 18:** TG402 from SIN (08:15 → 09:35) or 6E1509 from HYD (09:20 → 14:30). River sunset and dinner.
- **Sat 19 (signature day):** Grand Palace and Wat Pho at opening, a private longtail through the Thonburi canals, a long Thai massage, then a Michelin dinner.
- **Sun 20:** Chatuchak weekend market early, pool, then a sunset river cruise.
- **Mon 21 – Thu 24:** same as Option 1.

### Option 3: Trisara, all six nights (Signature Ocean View Pool Suite)
- **Fri – Sun:** as Option 1, but you stay on Sunday: beach, spa, PRU.
- **Mon 21 – Wed 23:** work in the two-room suite (speed test confirmed in advance; travel router plus AIS and True eSIMs as backup). Sunset swim after work.
- **Thu 24, two choices:**
  - Leave at 06:00 for PG270 (07:45) to BKK, meet the family, then PG905 11:20 → 12:40. This means two separate tickets and adds $622 to the family's fare.
  - Or Thai AirAsia FD612 14:30 → 16:05, **only if it is confirmed to fly on Thursdays**.

---

## G. Full trip, 18–31 Dec (recommended)

| Date | Couple | Grandparents + children |
| --- | --- | --- |
| Fri 18 – Sun 20 | Trisara, Phuket (beach weekend) | At home |
| Sun 20 – Thu 24 | Four Seasons Bangkok (Mon–Wed work) | Night of Wed 23: TG330 HYD 01:30 → BKK |
| **Thu 24** | PG903 07:55 → SAI 09:15, **together** | PG903 (same flight) |
| Thu 24 – Mon 28 | **Sofitel Angkor Phokeethra**: couple + children in a family unit, grandparents in a connecting room (about $6,097 for 4 nights, V1 prices for each configuration; confirm room types) | |
| Fri 25 | Angkor Wat sunrise (about 06:23), Ta Prohm, back by 10:30; Phare Circus 17:00 matinee | |
| Sat 26 | Banteay Srei at opening, Beng Mealea (included in the Angkor Pass), pool afternoon | |
| Sun 27 | Bayon and Angkor Thom from 07:30, Preah Khan; Kampong Phluk floating village at sunset | |
| Mon 28 | 6E1656 09:00 → Kolkata → 6E6908 → Hyderabad 17:15 (all six) | |

**Siem Reap essentials**
- **Visas:** Cambodian e-visa for all six, about $36 each including processing, taking 3 business days. Apply by about 1 Dec at evisa.gov.kh (V2).
- **e-Arrival card:** free and mandatory, filed within 7 days before landing at arrival.gov.kh (V2).
- **Angkor Pass:** 3-day pass $62 per adult; under-12s are free with their passport. Buy online from Angkor Enterprise only (V2).
- **Airport:** SAI is about 45 km from town, a 1–1h15 drive. Book a 7–9-seat van.
- **Backup hotel:** Park Hyatt (two connecting rooms, about $4,624, V1 for 2-adult rooms; rollaway beds extra). It's central and walkable to the vegetarian restaurants (Peace Cafe, Banllé, and Chusska for pure-veg Indian).
- **Also worth a direct quote:** Zannier Phum Baitang. Two pool villas would each take 2 adults + 2 children, and there's a kids' club.
- **Crowds:** Angkor's foreign arrivals are down 27.6% in Jan–Sep 2026 ([The Star](https://www.thestar.com.my/aseanplus/aseanplus-news/2026/10/12/cambodia039s-angkor-tourism-expected-to-rebound-as-kingdom-spares-no-effort-to-end-online-scams), V2), so expect lighter crowds.

**Phase 3, 28–31 Dec: go home with the family on the 28th. An extension isn't worth it.**
- **It's work time, not holiday:** 29–31 Dec are weekdays you would spend working, so an extension buys three evenings, not leisure.
- **It costs more:** about **$2,500–4,000** extra for flights (about $860–1,040 for two to Bangkok and back to Hyderabad, V1) plus three hotel nights (E).
- **You'd repeat Bangkok,** where you'll already have spent four nights.
- **The children fly home anyway,** and you'd escort them on the same flights.
- **If you still want it:** fly SAI → Bangkok on 28 Dec (TG589 09:50 or KR721 12:10), then **6E1510 BKK 15:30 → HYD 17:50 on 31 Dec** ($436 for two, V1). Avoid TG329, which lands at 23:55.

**Leave needed:** Fri 18 (travel), Thu 24 (travel/family) and Mon 28 (travel). Fri 25 is Christmas Day, a public holiday in India and Singapore. The Sunday move uses no leave.

---

## H. Cost comparison (couple, Phase 1; USD)

- **V1** = verified live floor. **E** = estimate.
- Transfers, dining and experiences are planning allowances (E): about $200/day for dining for two at luxury hotels; a private Phang Nga Bay boat, spa and river cruise for experiences.

| Component | **1. Split: Trisara + FS Bangkok** | 1b. Split with COMO weekend | 2. FS Bangkok × 6 | 3. Trisara × 6 |
| --- | --- | --- | --- | --- |
| Accommodation | $4,648 (V1) + ~$6,590 (E; V1 floor $4,027) = **~$11,240** | $934 (V1) + ~$6,590 (E) = **~$7,520** | **~$9,890** (E; V1 floor $5,953) | **$11,327 floor (V1)** + suite uplift (U) |
| Flights, from SIN | $852 + $230 + $452 = **$1,534** (V1) | $1,534 | $852 + $452 = **$1,304** (V1) | $852 + $854 = **$1,706** (V1) + **$622 extra for the family** |
| Flights, from HYD | $571 + $230 + $452 = **$1,253** (V1) | $1,253 | $464 + $452 = **$916** (V1) | $571 + $854 = **$1,425** (V1) + $622 family |
| Transfers | ~$200 (E) | ~$200 (E) | ~$120 (E) | ~$150 (E) |
| Dining | ~$1,200 (E) | ~$1,200 (E) | ~$1,100 (E) | ~$1,300 (E) |
| Experiences | ~$1,000 (E) | ~$1,000 (E) | ~$600 (E) | ~$1,000 (E) |
| **Total, from SIN** | **~$15,200** | **~$11,500** | **~$13,000** | **≥ $16,100** (before suite uplift) |
| **Total, from HYD** | **~$14,900** | **~$11,200** | **~$12,600** | **≥ $15,800** |

**Phase 2, whole family, recommended setup:**

| Item | Cost |
| --- | --- |
| Family flights out | $2,200 (V1) |
| Return flights, all six | $1,734 (V1) |
| Sofitel, 4 nights | ~$6,097 (V1 configurations) |
| Angkor passes | $248 (V2) |
| Visas | ~$216 (V2) |
| Phare | ~$188 (V2) |
| Guide and van | $300–540 (E) |
| Airport vans | ~$125 (E) |
| Dining | ~$600 (E) |
| **Total** | **~$11,800** |

**Whole trip, 18–28 Dec, recommended plan from Singapore:** about **$27,000** for six people. Using the COMO weekend brings it to about $23,300.

---

## I. Sensitivity analysis (`scoring/score.py`)

| Scenario (romance / work / hotel / travel / value) | Winner | Runner-up | Margin |
| --- | --- | --- | --- |
| Base (25/25/20/20/10) | Bangkok (8.32) | Split plan (8.10) | 0.22 |
| Romance first (45/15/20/10/10) | **Split plan (8.10)** | Bangkok (7.83) | 0.27 |
| Work first (15/45/20/10/10) | Bangkok (8.28) | Split plan (8.10) | 0.18 |
| Travel first (15/20/15/40/10) | Bangkok (8.82) | Split plan (8.05) | 0.77 |
| Value first (20/20/15/15/30) | Bangkok (8.45) | Split plan (7.85) | 0.60 |

| Hotel scenario | Winner |
| --- | --- |
| Base, work first, travel first, value first | **Four Seasons Bangkok, Executive Suite** |
| Romance first | Capella Bangkok, Riverfront Suite |

**How robust is this?**
- **Very robust:** Bangkok as the workweek base and the Thursday hub. Bangkok or the split plan wins every scenario, and the Four Seasons Executive Suite wins four of five hotel scenarios.
- **The one judgement call** is whether to add the Phuket weekend. In the base weighting it trails Bangkok-only by 0.22, which is inside the model's scoring uncertainty of about ±0.3. I break the tie towards the brief ("romantic").
- **Phuket alone never wins any scenario.** Its Thursday logistics and unverified resort Wi-Fi cost it.

**Trying to disprove the recommendation**
- **A cheaper competitor that's materially better?** Rosewood Bangkok's entry rooms are $2,213 for four nights, about 55% of the Four Seasons floor (V1). Its Manor Suite (79 m², separate living room) needs a quote. It loses on romance (no river) and room size, not on work. That makes it the right switch if the Four Seasons suite quote is high (see section J).
- **Overvaluing the brand?** Partly. The Four Seasons edge rests on a property-reported speed figure and a confirmed two-room layout, not on independent proof. Treat the speed test as a condition of booking.
- **Underestimating the cost of changing hotels?** The Sunday move costs about 3.5 hours door to door, $230 in flights and one more check-in. It saves the family $622 (PG903 instead of PG905) and spares you a 06:00 departure from Phuket and a self-transfer on Christmas Eve.
- **Would a different room category improve work?** Yes, and it matters more than the hotel choice. Any open-plan room or studio fails the "two calls at once" test. Book only a category with a door between the two spaces.
- **An equally good place with easier flights?** Bangkok-only is the easier-flight version of this plan. Nothing else reaches Siem Reap as easily.

---

## J. Final verdict

- **Single best destination:** **Bangkok**, as the workation base and the Dec 24 hub. Add **Phuket for the free weekend**.
- **Exact bookings:**
  1. **Trisara, Phuket:** Fri 18 – Sun 20 Dec, the entry pool suite (Expedia $4,648 for 2 nights).
  2. **Four Seasons Hotel Bangkok at Chao Phraya River:** **Executive Suite**, Sun 20 – Thu 24 Dec (expected about $6,600; entry floor $4,027).
- **Best alternative:**
  - **Capella Bangkok Riverfront Suite** for the workweek.
  - Or, if you'd rather not move on Sunday, **all six nights at the Four Seasons Bangkok**.
- **Switch rules:**
  - **To Capella:** if its Riverfront Suite quote is within about **20%** of the Four Seasons Executive Suite quote. Capella leads by 0.23 points before value; this assumes about 1 value point per 10% of price.
  - **To Rosewood's Manor Suite:** if the Four Seasons suite comes in above about **$1,800 a night all-in**, or more than **2×** Rosewood's suite quote.
  - **To COMO Point Yamu for the weekend:** if Trisara's quote rises above about **$5,000** for the two nights, or you'd rather save about $3,700.
- **Most important risks and unknowns:**
  1. **Wi-Fi** isn't independently verified anywhere. Make a speed test from the exact suite type a booking condition. Bring a travel router and two Thai eSIMs (AIS and True).
  2. The **Four Seasons Executive Suite rate and availability** for 20–24 Dec are unknown.
  3. **Thailand's visa exemption for Indians** changed three times in 2026; it's 30 days since 15 Sep 2026 (V1/V2). Re-check before travel and file the **TDAC**.
  4. **Thailand–Cambodia relations:** the air corridor is open (V2). Keep the Vietnam Airlines routing via Ho Chi Minh City as plan B.
  5. **Remote work on tourist entry** isn't explicitly authorised in Thailand (V2). Enforcement on short stays is rare (E).
  6. **The IndiGo Kolkata–SAI return** is a fragile Mon/Thu/Sat route. The Bangkok routing is the fallback.
- **Next three actions:**
  1. **This week, book the 24 Dec flights:** the family's TG330 + PG903 on one ticket ($2,200) and your PG903 ($452). Seats are limited, so these come first. Book the 28 Dec IndiGo return for all six at the same time.
  2. **Email the Four Seasons Bangkok (and Capella in parallel)** for a 20–24 Dec Executive Suite / Riverfront Suite quote. Include breakfast, cancellation terms, a speed-test screenshot, a wired port, and a second desk chair. Hold Trisara on a refundable rate meanwhile.
  3. **Book your inbound flight to Phuket** and the Sunday TG212. Then start the paperwork: Cambodian e-visas for all six (by about 1 Dec), the Sofitel family configuration in writing, Angkor Passes online, and the e-Arrival and TDAC forms in the week before travel.
