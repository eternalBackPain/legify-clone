# Legification

Legification is a minimal tool for quick authoritative search of Australian legislation.

## Structure

- `v1/` archives the original Supabase-backed Vite app.
- `v2/` is the active app. It searches `v2/public/legislation.json` in the browser.
- `db_construct/` contains the notebook used to manually rebuild the JSON database.

## Run the app

```sh
cd v2
npm install
npm run dev
```

## Build

```sh
cd v2
npm run build
```

## Refresh the data

Open and run `db_construct/construct_legislation_json.ipynb`. The notebook fetches current Federal Register title data and exports `legislation.json`; after checking it, manually replace `v2/public/legislation.json`.
