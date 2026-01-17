# poe-common
A library containing helpers and types for Path of Exile's developer API

## Types

Types are scraped from a downloaded version of the (developer docs)[https://www.pathofexile.com/developer/docs/reference#types]. Using (scrape.ts)[./scrape.ts], it will auto-generate types utilizing the information from that page. Currently, you must download the page with a browser and save it at docs/docs.htm. Afterwards you can `npm run scrape` to auto-generate types/poe.d.ts

## class-validator integration
Generates types for class-transformer and class-validator so you can utilize the POE API and generate proper types and utilize them in your own application endpoints for type checking: `plainToInstance(League, /* ... data */)`