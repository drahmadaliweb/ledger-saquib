# Privacy notes

- The GitHub Pages source is public web content and contains no transactions, account balances, JSON backups, passwords, or Groq key.
- Supabase stores the signed-in user's ledger state. Row-level security binds the stored row to the authenticated user ID.
- The browser-visible Supabase URL and publishable/anon key are not passwords. Database row-level security is the access control.
- Groq's key is stored in Supabase Edge Function secrets. Receipt and statement images are sent to Groq only after the user checks the AI upload consent box.
- Receipt attachments stay in the browser that added them. A full JSON backup can include them; protect that file like a financial document.
- Sign out on a device you do not control. Do not commit backups, `.env` files, service-role keys, or database passwords.
