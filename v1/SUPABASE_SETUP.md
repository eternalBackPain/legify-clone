# Supabase setup

## 1. Create the project

1. Create a new project in Supabase.
2. Wait for the database to finish provisioning.

## 2. Create the table

1. Open `SQL Editor`.
2. Paste in the contents of [`supabase/setup.sql`](./supabase/setup.sql).
3. Run the SQL.

## 3. Confirm the schema

1. Open `Table Editor`.
2. Confirm the `legislation` table exists.
3. Confirm these columns exist exactly:
   - `id`
   - `entry_created_datetime`
   - `source`
   - `jurisdiction`
   - `title`
   - `year`
   - `url`
   - `type`

## 4. Copy API values

1. Open `Project Settings` -> `API`.
2. Copy:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

## 5. Set frontend env vars

1. Copy `.env.example` to `.env`.
2. Set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 6. Set GitHub Actions secrets

In the GitHub repo settings, add these actions secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 7. Run the first import

1. Push the repo to GitHub.
2. Open `Actions`.
3. Run `Sync Federal Register` with `Run workflow`.
4. Confirm rows appear in `public.legislation`.

## 8. Verify app search

1. Start the app with `npm run dev`.
2. Search for `Acts Interpretation Act 1901`.
3. Confirm the result opens `legislation.gov.au`.
