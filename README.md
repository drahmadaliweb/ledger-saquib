# Daily Ledger — Supabase + GitHub Pages

Mobile-friendly, installable version of the Daily Ledger. GitHub Pages serves the app; Supabase handles sign-in and private cloud sync; a Supabase Edge Function keeps the Groq key out of the browser.

## Before you publish

- Create a **new Supabase project just for this ledger**. Do not reuse the project for your academic website.
- The repository contains no transaction records and no Groq secret. The current source tracker had embedded seed transactions; this copy starts with an empty ledger.
- GitHub Pages is a public website, even when its source repository is private. Do not commit JSON backups, passwords, a database password, or a Supabase secret/service-role key.
- `supabase-config.js` contains only the Supabase Project URL and publishable/legacy anon key. Those browser values are public; the SQL below makes the data private through row-level security.
- Receipt images attached to transactions stay in that browser and are included in its JSON backup; transaction records and settings sync. Image attachments are not copied to another device in this version.

## 1. Create the Supabase project

1. In Supabase, create a new project named **Daily Ledger**. Choose a US region. Keep the database password private.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it.
3. In **Authentication → Providers**, enable Email sign-in. Keep email confirmation enabled if you want email verification.
4. After you know your GitHub Pages URL, set **Authentication → URL Configuration → Site URL** and add the same page URL under **Redirect URLs**. Example: `https://YOUR-GITHUB-NAME.github.io/daily-ledger/`.
5. Open **Project Settings → API**. Copy the Project URL and the **publishable key** (or legacy `anon` key) into `supabase-config.js`. Never use a secret or `service_role` key in that file.

The table has per-user row-level security. Each signed-in account can read and change only its own ledger snapshot. Do not remove those policies or grants.

## 2. Create the GitHub Pages site

1. Create a GitHub repository named `daily-ledger`.
2. Upload the contents of this folder to the repository root, including `.github/workflows/pages.yml`. Do **not** upload any JSON backup.
3. In **Repository Settings → Pages**, choose **GitHub Actions** as the publishing source.
4. Wait for the **Deploy Daily Ledger to GitHub Pages** workflow to finish. GitHub will show the page URL in the workflow run and Pages settings.
5. Return to Supabase and set the Site URL and Redirect URL from step 1 to that exact page URL.

Your deployed page can be visited by anyone, but they need an account to open the ledger. The page source and public Supabase key are visible; your financial records are protected by Supabase Auth and the database policies.

## 3. Move your existing data

1. On the Mac tracker you currently use, open **Data & settings → Download full backup**. Save the JSON file somewhere private; do not put it in the GitHub repository.
2. Open the new GitHub Pages URL, create your ledger sign-in, and sign in.
3. In the tracker, open **Data & settings → Restore JSON** and choose that backup. The imported ledger will sync to Supabase.
4. Sign in with the same account on your phone. Refresh the page to load the latest cloud copy.

The tracker uses a version check to avoid silently overwriting a newer copy from another device. If you see a message that another device has newer data, download a JSON backup first, then use **Load latest from cloud**.

## 4. Turn on Groq receipt and screenshot analysis

AI analysis uses a Supabase Edge Function. The Groq key must be saved as a Supabase secret; never add it to `supabase-config.js` or GitHub.

1. Install the Supabase CLI on your Mac, then open Terminal in this project folder.
2. Run `supabase login` and `supabase link --project-ref YOUR_PROJECT_REF`.
3. In Supabase Dashboard, open **Edge Functions → Secrets** and add:
   - `GROQ_API_KEY` — your Groq key
   - `LEDGER_APP_ORIGIN` — your page origin, such as `https://YOUR-GITHUB-NAME.github.io` (no repository path or trailing slash)
4. Deploy the function with `supabase functions deploy ledger-ai-import`.
5. Reload the site, open **AI Import**, and click **Load available models**.

Selected images, the selected account, category names, and instructions are sent to Groq for analysis. Your ledger history is not sent. Review and correct all extracted rows before importing.

## Phone use

Open the GitHub Pages URL on your phone and sign in with the same account. On iPhone Safari, use **Share → Add to Home Screen**. On Android Chrome, use **Install app** or **Add to Home screen**. Cloud sign-in and syncing require an internet connection.

## Backups

Continue downloading the full JSON backup periodically and keep it outside GitHub. Supabase Free projects can pause after a week with too little activity, and the free plan does not include automatic database backups. Keep your own backup regardless of plan.
