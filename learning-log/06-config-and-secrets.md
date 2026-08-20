# Chapter 6 — Config & Secrets

## Definition of Done

- [✅] A single `config` module (`src/shared/config.ts`) reads `process.env`, validates it with a zod schema, and exports a typed `config` object
- [✅] The app refuses to boot with a clear, specific error when a required variable is missing or malformed (tested: blank out `JWT_SECRET` and confirm the crash names the key)
- [✅] Types are coerced (`PORT` is a number, not a string) and constraints enforced (`JWT_SECRET` length, URLs are valid)
- [✅] Nothing outside `config.ts` reads `process.env` directly — `db.ts` and `redis.ts` read their URLs from `config`
- [✅] `DATABASE_URL` and `REDIS_URL` flow through config, and the app connects to the Docker services using them
- [✅] `.env` is git-ignored and loaded in development; `.env.example` is committed with keys and placeholders (no real secrets)
- [✅] No secret is in the source or in Git history; `JWT_SECRET` was generated, not typed

## Reflection

**(1) Why does configuration belong in the environment rather than in code — give the two failures it prevents.**

If we do configuration in the code then the code is committed, and hence the configuration and our secret keys/db password get committed too, which is risky. 1st failure it prevents: not allowing a secret key to be leaked. 2nd failure it prevents: the same code would need to be changed for every environment (dev/test/prod) since values like DB URLs differ — keeping config in the environment lets one codebase run anywhere.

**(2) Why validate config and fail fast at startup instead of reading `process.env` where you need it — describe the bad outcome fail-fast avoids.**

Validating config checks each value up front, so if a value is missing or malformed it's caught immediately and the app refuses to boot. If it does not fail fast, the broken app will boot and seem fine, and might crash after 3-4 hours of working — that's a big problem to debug in production.

**(3) What is `.env.example` for, and why is it safe to commit when `.env` is not?**

We write `.env.example` so that if any teammate clones the repo, he can easily see what variables are used in `.env` and fill the real values into the placeholders. It's safe to commit because it does not contain any real/actual secret values — they're just placeholders.

---

## Quick Quiz

**1. `process.env.PORT` is the string `"3000"`. Which line in the schema turns it into the number `3000`, and why can't TypeScript do this for you?**

`PORT: z.coerce.number().int().positive().default(3000)` — this line turns `"3000"` into `3000`. TypeScript can't do it for us because at runtime no types exist — they only exist at compile time.

**2. Validation fails at boot. Why log the key names but never the values?**

Values are our secrets, they should never be logged as anyone could misuse them — so just to point at the actual error, we log key names only.

**3. A teammate clones the repo and the app won't start. Which committed file tells them what to set, and why is committing it safe?**

`.env.example` is the committed file that tells them what to set, and it's safe to commit because it doesn't hold any actual secret values — they're just placeholders.

**4. You find a `JWT_SECRET` was committed last week. Why is deleting the line not enough, and what must you do instead?**

Because everything committed is now part of Git history, so deleting the line is not enough — we have to rotate it, i.e. generate a new `JWT_SECRET` value and replace the old one everywhere.

**5. Name the one rule about `process.env` that keeps the whole config approach clean.**

We read `process.env` only once, inside the validated config module (`config.ts`) — that's the one rule that keeps the approach clean.
