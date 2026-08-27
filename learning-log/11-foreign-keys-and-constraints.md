# Chapter 11 — Foreign Keys & Constraints

## Checklist

- [✅] Your learning-log DDL for chapters 8-10 includes the ON DELETE clauses from the complete FK summary in chapter 11.03.

Ans: yes these are included in the learning log.

- [✅] In your learning log, write one sentence for each of the four ON DELETE behaviours explaining when you would choose it.

Ans:
NO ACTION means block the delete with an error, and if the FK is deferrable then defer the check until transaction completion.
RESTRICT means block the delete with an error immediately, without any defer.
CASCADE removes the child rows automatically along with the parent.
SET NULL sets the FK column to null so the child can exist independently.

- [✅] In your learning log, write a brief note on the applicant account deletion problem.

Ans: An applicant has applications submitted against them, so if you try to delete the applicant account, RESTRICT forces the application layer to explicitly choose what happens to those applications first. There are two paths: anonymise, where the applicant's name and personal data get removed from the applicant row and profile_snapshot, but the applications stay so the recruiter's record and counts remain intact — or hard-delete, where the submitted applications are removed first, and only then the applicant account is deleted.

- [✅] Give one example of a rule that looks like it belongs in a CHECK constraint but actually belongs in the validation layer.

Ans: `CHECK (deadline > CURRENT_DATE)` on jobs looks like it should be a CHECK constraint, but it isn't. This check only runs at INSERT/UPDATE time — it never re-checks existing rows as time passes, so a job that was valid when created just silently becomes "wrong" as the calendar moves forward, and the constraint never notices. It also blocks legitimate cases like restoring old data or test fixtures with past dates, and it gives a raw database error instead of a proper validation message. This belongs in the validation layer (ch16) instead.

---

## Log it

**1. Which FK decision in this chapter required the most careful reasoning? What does RESTRICT protect against in that specific case?**

`applications.applicant_id → applicants(id)` needed the most reasoning. There wasn't one obvious right answer — deleting an applicant's account could reasonably mean either anonymising their data or fully removing their applications, and the database can't decide that on its own. RESTRICT protects against the applicant's applications getting silently wiped out the moment their account is deleted, before anyone explicitly decided whether that history should be preserved (anonymised) or actually erased.

**2. Describe a scenario where a developer might feel tempted to add ON DELETE CASCADE to a FK that this chapter classifies as RESTRICT. What would happen if they did?**

A developer removing a company might think "if I delete the company, may as well auto-delete all its jobs too so I don't have to clean them up manually," and add CASCADE to `jobs.company_id`. If they did, deleting one company row would silently delete every job that company ever posted, and by extension all the applications tied to those jobs — permanently wiping the company's entire hiring history in one step, with no way to undo it.

---

## Quick quiz

**Q1. A recruiter's user account is hard-deleted, and the recruiter row is cascade-deleted as a result. Which rows in `applications` are affected?**

None. `applications` has no foreign key pointing to `recruiters` at all — applications are only linked to `applicants` and `jobs`. So deleting a recruiter, however it happens, has no effect on the applications table.

**Q2. A company needs to be permanently removed. It has two active recruiters, five posted jobs, and twelve applications. Write the order of table operations needed.**

1. `applications` — delete the applications tied to those five jobs first
2. `jobs` — then delete the five jobs, since they no longer have any applications referencing them
3. `recruiters` — remove or transfer the two recruiters
4. `companies` — finally delete the company row, since nothing references it anymore

**Q3. Why is `CHECK (deadline > CURRENT_DATE)` the wrong approach, and where should this validation live instead?**

First, the constraint only fires on INSERT/UPDATE — it never re-evaluates rows that already exist, so a deadline that was valid when the job was created silently becomes "invalid" as time passes without the database ever flagging it, and it also blocks legitimate operations like restoring historical data with old dates. Second, when it does fire, it produces a raw database error instead of a clear, user-friendly validation message. This rule belongs in the validation layer (ch16), where it can give a proper error message and stay easy to change later.
