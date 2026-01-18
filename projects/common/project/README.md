# poe-common
A library containing helpers and types for Path of Exile's developer API

## Types

Types are scraped from a downloaded version of the (developer docs)[https://www.pathofexile.com/developer/docs/reference#types]. Using (scrape.ts)[./scrape.ts], it will auto-generate types utilizing the information from that page. Currently, you must download the page with a browser and save it at docs/docs.htm. Afterwards you can `npm run scrape` to auto-generate types/poe.d.ts

## zod integration

Types are generated into zod format, so you can easily use it with anything that uses zod.
