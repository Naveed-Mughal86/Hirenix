# Chapter 16 — Request Validation: Definition of Done

## Checklist

- [✅] `src/shared/validate.ts` exists with `ValidationError`, `validateBody`, `validateQuery`, `validateParam`, and `uuidParam` exported.
- [✅] `src/modules/jobs/jobs.schema.ts` exists with `createJobSchema`, `updateJobSchema`, `listJobsQuerySchema`, and their inferred types exported.
- [✅] TypeScript compiles cleanly — `npx tsc --noEmit` runs with zero errors.
- [✅] Manual validation smoke-test passes — invalid input returns the expected error shape with both failing fields listed.
- [✅] `updateJobSchema` accepts a partial body with no defaults applied — `updateJobSchema.safeParse({})` returns `{ success: true, data: {} }`.
- [✅] `validateParam(uuidParam, 'not-a-uuid')` throws a `ValidationError`, and a valid UUID string passes through correctly.

---

## Log it

**1. `updateJobSchema = jobFieldsSchema.partial()`. Recruiter sends `{ "status": "archived" }` in a PATCH body. What does `safeParse` return, and why?**

Ans: it returns `{ success: true, data: { status: "archived" } }`. Since `.partial()` makes every field optional, only the field actually sent needs to be valid — the other fields just aren't present in the result, nothing gets filled in or defaulted for them.

**2. Query params are always strings. What happens using `z.number().min(1)` (no coerce) on `page` when the request is `?page=2`?**

Ans: validation fails, because the incoming value is the string "2", not the number 2, and without coerce Zod expects an actual number type — the type mismatch fails before it even gets to checking `.min(1)`.

---

## Quick quiz

**Q1. `req.body = { "title": "Backend Engineer", "status": "pending", "deadline": "June 1, 2025" }`. What does `validateBody(createJobSchema, req.body)` throw, and why does each field fail?**

Ans: it throws a ValidationError with two failing fields. `status: "pending"` fails because the allowed values are only 'draft', 'open', 'closed' — pending isn't one of them. `deadline: "June 1, 2025"` fails because the schema expects an ISO date format like "2025-06-01", not a human-readable date string. `title` is fine and doesn't fail.

**Q2. Why use `safeParse` + a custom `ValidationError` instead of just calling `schema.parse(data)` and letting Zod throw directly?**

Ans: safeParse never throws on its own, it just returns a result object, so wrapping it in our own ValidationError keeps our error format consistent and independent of Zod's internal error shape. If we used `schema.parse()` directly, the error handler in ch17 would have to know about Zod's own error type specifically, tying our error handling directly to whichever validation library we happen to be using.

**Q3. A recruiter submits 200 screening questions, which passes schema validation since there's no array length limit. Name two places a limit could be enforced, and the trade-off of each.**

Ans: 
1. In the schema itself, e.g. `z.array(questionSchema).max(20)` — simple and enforced automatically everywhere the schema is used, but it's a hardcoded number, so changing it later (like allowing more questions for a premium plan) means a code change and redeploy.
2. In the service/application layer, checking against a dynamic limit (like the company's plan tier) — more flexible and can give a more specific error message, but it only applies wherever that check is explicitly written, so any other code path that skips it wouldn't be protected the way a schema-level check automatically would be.
