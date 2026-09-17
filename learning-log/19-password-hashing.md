# Chapter 19 — Password Hashing

## Checklist

- [✅] `src/shared/password.ts` exists with `hashPassword` and `verifyPassword` as named exports, no default export, `BCRYPT_ROUNDS` defined as a named constant at the top.
- [✅] `bcryptjs` is in dependencies and `@types/bcryptjs` is in devDependencies, both present in node_modules.
- [✅] TypeScript compiles cleanly — `npx tsc --noEmit` runs with zero errors.
- [✅] Hash format smoke test passes — hash starts with `$2b$12$`.
- [✅] Verify returns the correct boolean in both cases — matching password returns true, wrong password returns false.
- [✅] The hash call takes more than 100ms (typically 150-400ms), confirming the cost factor is actually applied.

---

## Log it

**1. `BCRYPT_ROUNDS` changed from 12 to 13 and redeployed. New registrations get cost-13 hashes, existing users have cost-12 hashes stored. What happens when an existing user logs in?**

Ans: it doesn't break for them. The cost factor is stored right inside the hash string itself (`$2b$12$...`), so `bcrypt.compare` reads the cost from the hash it's comparing against, not from whatever `BCRYPT_ROUNDS` is currently set to in the code. Existing users still verify fine at cost 12, new signups just get cost 13 going forward — the two can coexist without any migration needed, though the old hashes won't automatically upgrade to cost 13 on their own.

**2. Two requests register at the same millisecond. Are the two `hashPassword` calls themselves a problem? What would actually be a problem, and how should it be checked?**

Ans: the hashing calls themselves aren't a problem — they're independent computations, nothing shared between them. The real risk is a race condition on uniqueness, like two people registering with the same email at the exact same time. If the app checks "does this email exist" and then inserts as two separate steps, both requests could pass the check before either insert happens, creating a duplicate. The correct way to handle this is to rely on the database's UNIQUE constraint on email (same pattern as the duplicate-application problem from earlier chapters) and catch the constraint violation error, rather than trusting a pre-check query alone.

---

## Quick quiz

**Q1. `BCRYPT_ROUNDS` set to 16 instead of 12. What changes for the legit user vs the attacker, and why is the effect much bigger than 4x?**

Ans: the cost factor is exponential, not linear — it controls 2^rounds iterations of the hashing algorithm. Going from 12 to 16 isn't "4 more work," it's 2^4 = 16x more work. For the legitimate user, login just takes roughly 16x longer than before (maybe going from ~200ms to a few seconds) — noticeable but bearable since it happens once per login. For an attacker trying to brute-force millions or billions of password guesses, that same 16x slowdown applies to every single guess, which multiplies across their entire attack — turning an attack that might've taken days into one that takes years, effectively making it infeasible at scale even though the legitimate user barely notices the difference.

**Q2. hashPassword takes 250ms. Should bcrypt run in a worker thread so it doesn't block other requests?**

Ans: see the full explanation above — short version: `await` only controls when the function resumes, not where the actual computation happens. bcrypt hashing is CPU-bound work, and since bcryptjs is pure JavaScript, that computation runs on the same single thread as the rest of the app, meaning it genuinely blocks the event loop for its full duration regardless of `await`. This is different from I/O-bound work like a database query, where the waiting happens outside the JS thread and the event loop stays free. At low traffic this blocking is a minor, occasional cost. At higher traffic with many simultaneous registrations, it becomes a real bottleneck, and that's when moving bcrypt to a worker thread (or using a native bcrypt binding that offloads to a thread pool) actually becomes worth the added complexity.

**Q3. bcryptjs truncates passwords to 72 bytes. Two recruiters set the same 100-character password except the last 28 characters differ. What does verifyPassword return comparing recruiter 2's plaintext against recruiter 1's hash — and is this a security problem?**

Ans: it returns true — they match, even though the full passwords are different. Since both recruiters share identical first 72 characters and only differ after that, and bcrypt only ever looks at the first 72 bytes, the part that actually gets hashed and compared is identical for both of them, so verification succeeds despite the full plaintexts not being the same.

This is a security problem in the sense that it gives a false sense of security — a "100-character password" doesn't actually add any strength beyond the first 72 bytes, and two genuinely different passwords can silently authenticate as a match if their first 72 characters happen to line up. This is exactly why ch20 adds an explicit max-length validation of 72 — so the truncation never happens silently, and users aren't misled into thinking extra length past that point is doing anything.