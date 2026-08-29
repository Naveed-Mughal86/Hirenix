# Chapter 13 — Seed Data

## Checklist

- [✅] `npm run seed` exits cleanly — the final line in the output is `Seed complete.` with no errors.
- [✅] All tables have data — counts match (users, jobs, applications).
- [✅] Running `npm run seed` a second time produces the same counts.
- [✅] Jamie appears in two different recruiters' inboxes at different stages.
- [✅] The draft job is invisible to an open-job filter.
- [✅] `scripts/seed.ts` is committed to git.

---

## Log it

**1. Why does the script hash passwords at all? The seed users are fake — would storing the literal string `'password123'` in `password_hash` break anything?**

Ans: yeah it would break login, because the login code always compares against a hashed value using bcrypt.compare. If the db has plain text instead of a hash, that comparison won't work right, so we'd never actually be able to log in with the seeded fake users, which defeats the point of seeding them in the first place.

---

## Quick quiz

**Q1. Can another connection read the empty table during the TRUNCATE-to-COMMIT window?**

Ans: No, it can't. The TRUNCATE hasn't committed yet, so other connections still see the old data until the transaction actually commits. That's just transaction isolation — nothing outside the transaction sees the in-progress changes.

**Q2. What bcrypt feature makes unique hashes possible for identical passwords, and what attack does sharing one hash enable?**

Ans: bcrypt adds a random salt to the password before hashing, so even the same password produces a different hash each time. If every account shared one hash, cracking a single user's password would instantly reveal every other user's password too, since they'd all be the same — basically one crack compromises everyone at once.

**Q3. `applicants` insert placed after `applications` insert — what happens and which constraint causes it?**

Ans: It fails with a foreign key violation. `applications.applicant_id` references `applicants.id`, so the applicant row has to exist first — if applications tries to insert before the applicant row exists, there's nothing for it to point to yet.
