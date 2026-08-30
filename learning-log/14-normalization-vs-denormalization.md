# Chapter 14 — Denormalization & Key Takeaways

## Log it

**1. `applications.screening_answers` as JSONB vs a normalized `screening_answers` table `(id, application_id, question_id, answer)` — what does each make easier or harder?**

The normalized table makes it way easier to query across individual answers — like finding every applicant who answered "yes" to a specific question. That's just a plain `WHERE question_id = ... AND answer = ...` query. Doing that with JSONB means parsing and unpacking the json on every row, which is slow and awkward.

On the other hand, JSONB makes it easier to read a whole application's answers at once, since they're all sitting in one row already. With the normalized table you'd have to join and pull multiple rows back together just to reassemble what's basically always consumed as one unit anyway — extra work for something that's rarely needed piece by piece.

**2. `profile_snapshot` duplicates data from `applicants`. Describe a scenario where the divergence is correct behavior, and one where it would be a real bug.**

Correct behavior: an applicant applies with the headline "Junior Developer," then months later updates their profile to "Senior Developer." When a recruiter opens that old application, they should still see "Junior Developer" — that's what the applicant actually was at the time they applied, and that's the context the recruiter's decision was based on. The snapshot staying frozen is the whole point here.

Real bug: an applicant makes a typo in their phone number when they apply, and it gets frozen into the snapshot. They fix it later in their profile, but if the recruiter is only ever shown the snapshot and there's no way to see the corrected contact info, the recruiter keeps calling/emailing a number that's wrong forever, with no indication anything changed. If this isn't handled carefully (e.g. no path to refresh contact-type fields), that's an actual problem, not intended behavior.

---

## Quick quiz

**Q1. A recruiter dashboard joins `applications → applicants` and reads `applicants.headline` directly instead of `profile_snapshot`. When is this correct, when is it wrong, and what's the trade-off vs reading the snapshot?**

It shows correct data as long as the applicant hasn't touched their profile since applying — in that case current and snapshotted data are identical anyway. It silently shows wrong data the moment the applicant updates their profile after applying — the dashboard would show today's headline instead of what it actually was when the recruiter made their evaluation, quietly breaking the historical record without any error or warning.

The trade-off: joining live gives you always-current data but loses historical accuracy — you can't tell what the data looked like at decision time. Reading the snapshot preserves that history, but if something wrong got frozen in by mistake, it stays wrong forever unless someone explicitly handles that case.

**Q2. List the six deployment steps to promote `jobs.attributes.min_experience` to a real column, in order. Which step is most dangerous to skip, and why?**

1. Run migration — add the real column (nullable, no constraint)
2. Deploy code — start dual-writing to both the JSONB key and the new column
3. Run backfill — copy the value out of `attributes` into the new column for existing rows
4. Run migration — add constraints (NOT NULL, CHECK, index)
5. Deploy code — switch reads to the new column, stop writing the JSONB key
6. Later — drop the JSONB key in a migration

Step 2 (dual-write) is the most dangerous to skip. If you skip it and jump straight to reading the new column, every row that existed before the migration has a NULL there, since nothing ever wrote to it. Any query filtering on the new column will silently miss all that older data — no error, just incomplete results that look like the data went missing.

**Q3. If job attributes like `tech_stack`/`seniority` (engineering) and `territory`/`commission_plan` (sales) were normalized into real columns, what would `jobs` look like, and what problem would JSONB avoid?**

The table would end up with a column for basically every attribute any job type might ever need — `tech_stack`, `seniority`, `remote_policy`, `territory`, `commission_plan`, `quota`, and so on, all living side by side on the same table. Every sales job row would have NULLs across all the engineering-only columns, and every engineering job row would have NULLs across all the sales-only columns. The table gets sparse and messy, and every time a new job category shows up (marketing, design, whatever), you'd need another migration just to add more columns that are only ever filled in for that one category.

JSONB avoids this because each job only stores the keys that are actually relevant to it — an engineering job's `attributes` has `tech_stack` and `seniority`, a sales job's has `territory` and `commission_plan`, and neither carries a pile of NULLs for fields that don't apply to it. New job categories just mean new keys, not a schema change.
