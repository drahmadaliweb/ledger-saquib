# Free Chase offer reader — first version

This kit installs a local Chrome extension and an “Import Chase offers” button in Daily Ledger. There is no subscription, AI service or bank API key.

## Install the ledger update

Run `python3 install_chase_offer_reader.py` inside your cloned ledger folder. Review and commit `index.html`, `sw.js`, `chase_offer_extension/` and this guide, then push to publish the ledger importer.

## Load the extension on your Mac

1. Open Google Chrome and type `chrome://extensions` in the address bar.
2. Enable **Developer mode** at the upper right.
3. Click **Load unpacked** and select the `chase_offer_extension` folder created inside your cloned ledger folder.
4. Pin **Daily Ledger — Chase Offer Reader** from Chrome’s Extensions menu.

Keep that folder in place. When its code is updated later, use **Reload** on the extension’s tile. The Developer mode setting enables this local installation; publishing to the Chrome Web Store is not required.

## Capture Chase offers

1. Sign in to Chase yourself. The extension does not log in or handle MFA.
2. Open the full **Chase Offers** page. Choose **one card** using Chase’s account selector.
3. Scroll and expand the page to load the offer tiles you want. Opened details are readable only if they are inside a supported tile; this version does not automatically open each offer.
4. Click the extension. Enter the matching ledger card nickname, such as “Chase Freedom Flex”. Do not enter a card/account number.
5. Confirm that this is the one card selected in Chase. Click **Read Chase offers**.
6. Review the captured merchant names and warnings. Select offers and click **Download for Ledger**.
7. In Daily Ledger, open **Cards & rewards → Offers → Import Chase offers** and select that JSON file.
8. Confirm the matching ledger card. Set categories and correct missing reward values, dates, limits and spending rules. Confirm activation only if verified in Chase. Then review the batch confirmation and import selected rows.

Switch Chase’s selected account and repeat for another card. Do not combine mixed-card pages into one export. This first version does not switch cards for you.

## Import behavior

- Existing matching offers are skipped. Changed terms are flagged and are not selected automatically.
- Offers with tracked purchases are not overwritten when terms change. Review those individually in the ledger.
- Ambiguous matches are blocked for manual review.
- No ledger expenses, statement credits, redemptions or offer activations are created.
- Undo last change reverses the entire successful import batch.
- Missing minimums/caps are **unknown**, not confirmed zero. If you leave them blank after reviewing the terms, the ledger stores them as no limit entered. Unknown single/combined rules must be chosen before importing.
- Unknown activation is saved as requiring activation. The extension never clicks “Add offer”.
- Expiry dates estimated from “days left” are flagged for verification. Missing years are not guessed.

## Coverage and test limits

This is a read-only first version based on known Chase offer-tile patterns, including commerce-tile and legacy sixersoffers containers, plus open shadow roots. It reads loaded tiles from the current top-level page; it cannot read closed shadow roots, cross-origin frames, unloaded offers, or details that have not been opened. It never clicks or changes the bank page.

Parsing and ledger imports were tested on representative sample pages. The extension has **not been tested against your signed-in Chase account**, so actual page compatibility and offer completeness are not guaranteed. If it detects zero offers, use the full Offers page and wait for tiles to load. If that still fails, the layout needs an extractor update; do not treat zero detected offers as zero available offers. Do not send passwords, cookies, or full bank-page HTML for troubleshooting.

## Data and permissions

- `activeTab`: temporary access to the Chase tab you explicitly choose by opening the extension.
- `scripting`: run the local tile reader when you click Read.
- `storage`: keep the card nickname locally and captured offers in Chrome’s session storage. No bank login is stored.
- No host permissions, scheduled/background collection, network calls, cookies permission, balance reading or authentication handling.
- Captured offers remain in browser session storage until cleared or the browser session ends. **Clear captured data** removes that draft. Downloaded JSON files remain in Downloads until you delete them.
- Only after you choose and confirm an export in your ledger are the offers saved through your ledger’s normal storage/sync.

## Clean up

After a successful Git push, remove `install_chase_offer_reader.py`. Keep `chase_offer_extension/`, because Chrome loads it directly. You can delete imported `chase-offers-YYYY-MM-DD.json` files from Downloads when no longer needed; do not commit those exports to GitHub.
