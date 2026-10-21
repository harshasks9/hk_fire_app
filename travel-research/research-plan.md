# Research plan: December 2026 SEA workation and Siem Reap family trip

Started 21 Oct 2026.

## Questions to answer
1. Which Southeast Asian destination gives the best six nights (Fri 18 – Thu 24 Dec) for a couple who want romance at the weekend and three productive workdays (Mon 21 – Wed 23), and then fly to Siem Reap on Thu 24 Dec?
2. Which property, and which exact room category, wins there?
3. What flights make the whole trip work: the couple from Singapore or Hyderabad, the grandparents and children from Hyderabad, everyone into Siem Reap (SAI) on 24 Dec, and home on 28 Dec?
4. Where should the family stay in Siem Reap, and how should 25–27 Dec be spent?
5. Is a 28–31 Dec couples extension worth it, compared with going home on the 28th?

## Candidate universe (screened from scratch)
Phuket · Krabi/Phang Nga Bay (incl. Koh Yao Noi) · Khao Lak · Koh Samui · Bangkok · Chiang Mai · Langkawi · Penang · Bali · Phu Quoc · Da Nang/Hoi An · Nha Trang/Cam Ranh · Luang Prabang · Cambodian coast · Siem Reap · Singapore · Kuala Lumpur

## Elimination criteria (applied before scoring)
- **E1 Weather:** December falls in that coast's main rainy or monsoon season, so beach days or boat transfers are at material risk.
- **E2 Connectivity:** more than one connection to reach SAI on Thu 24 Dec, and also more than one connection from both SIN and HYD.
- **E3 Entry:** visa friction for Indian passport holders with no practical workaround.
- **E4 Inventory:** no credible luxury room where two people can take calls at the same time.

## Workstreams (run in parallel)
| Stream | Output file |
| --- | --- |
| Destinations: weather, entry, remote-work rules, infrastructure | raw/destinations.md |
| Flights: all legs, live Expedia searches plus schedule cross-checks | raw/flights.csv, raw/flights.md |
| Hotels: Phuket, Phang Nga, Khao Lak, Krabi | raw/hotels-andaman.md |
| Hotels: Bangkok, Chiang Mai, Koh Samui, Luang Prabang | raw/hotels-cities.md |
| Hotels: Langkawi, Phu Quoc, Bali, Cambodian coast | raw/hotels-other.md |
| Siem Reap family segment | raw/siem-reap.md |

## Evidence rules
- **V1:** primary source (official government, airline or hotel page) or live inventory (Expedia search on the retrieval date).
- **V2:** credible secondary source dated within about 12 months.
- **E:** estimate, labelled as such and never mixed with verified prices.
- **U:** unknown; needs direct confirmation.
- A search that returns nothing is not proof that something doesn't exist.

## Known tool limits (21 Oct 2026)
- Booking.com, Agoda, Trip.com, Kayak, Google, Marriott.com, Hilton.com and most airline sites can't be reached from this environment (DNS or egress blocked). Live prices come from Expedia's search tools. Everything else comes from web-search results and is labelled accordingly.
- Expedia hotel results show the cheapest available room for the occupancy searched, not a named room category.

## Scoring model
- Destination weights: romance 25%, remote work 25%, hotel and room quality 20%, travel connectivity 20%, value 10%.
- Hotels use the same weights, applied to the specific room category.
- Unsupported attributes are capped at 5/10 and get a lower confidence flag.
- Sensitivity runs re-weight towards romance, work, travel and value in turn (scoring/score.py).

## Challenge step
Before finalising, actively try to break the leading recommendation: cheaper competitors, overvalued brand, the real cost of a Dec 24 connection, a better room category, and an easier-flight alternative.
