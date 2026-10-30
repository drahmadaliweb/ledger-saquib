# Custom reports and PDF export

This replaces the previous scheduled-email report setup. It adds an on-demand report builder under **Reports**. It needs no new SQL tables, Cron job, Resend account, or email configuration.

## Apply

1. Unzip this package inside your `ledger-saquib` folder.
2. From the repository root, run:

   ```bash
   bash custom-report-builder-patch/apply_report_builder_patch.sh
   ```

3. Open **Reports** and choose the report date range, comparison range, and categories. Click **Generate report**.
4. Click **Print / Save as PDF**. In the print dialog, choose **Save as PDF** (on iPhone/iPad, use the print preview and Share/Save to Files).

## Optional Groq commentary

Built-in insights are calculated locally and work without Groq. The **Generate AI insights · Groq** button sends only totals and category aggregates to the existing `ledger-ai-import` Edge Function. It does not send receipts, transaction descriptions, or account names. Your existing `GROQ_API_KEY` and model are reused.

To enable that button, deploy the updated existing function from the repository root:

```bash
supabase functions deploy ledger-ai-import --project-ref khovgcrnxwzmiupwxvjs
```

No new database SQL or function secrets are required. If Groq is over quota, the built-in insights and PDF report still work.

## Comparison and report details

- Report period defaults to the previous complete calendar month.
- Comparisons can use the three calendar months before the report start, the previous period with the same number of days, or a custom date range.
- When the periods have different lengths, the report shows both totals and average-per-30.44-day comparisons.
- Significant change callouts require both at least **15%** and at least **$50** change in normalized monthly amounts. A zero/negative comparison baseline has no percentage alert.
- Categories can be selected or cleared. The selection applies to both report and comparison periods.
- The report includes income, net spending, net savings, savings rate, category comparison, spending by account and merchant/detail, month-by-month trend, budget check, largest purchases, and transaction detail.
- Linked refunds reduce the original purchase; transfers, card payments, and expenses recorded as another person's share are excluded from spending, consistent with the tracker.

After review, commit and push the app changes to GitHub. The updated site does not use the earlier monthly report schema or scheduler. Since you did not run those SQL files, there is no report SQL to undo.
