## Overview

This repository contains two versions of a vanilla JavaScript Vite project.

- `v1/` archives the previous Supabase-backed implementation.
- `v2/` is the active app. It uses a static JSON database at `v2/public/legislation.json`.
- `db_construct/` contains the notebook used to manually rebuild the JSON database.

The app is a clone of the previous 'Legify' site. It is a search bar which provides instant autocomplete search results of current legislation in Australia. Clicking a result opens a new link with the authoritative version of that Act.

## Design

When designing the app, use the most minimal, bare-bones design choices.

I want to prioritise speed. It is already easy for a lawyer to visit the authoritative site of the legislation, so this app should make it very quick for a lawyer to search and find the most authoritative link.

I also want to ensure that the app is responsive and mobile-friendly.

## Data

Do not add Supabase back to the active app. The v2 app should search the local JSON file in memory using simple browser JavaScript.

To update the database, run `db_construct/construct_legislation_json.ipynb` manually and replace `v2/public/legislation.json` with the generated output.
