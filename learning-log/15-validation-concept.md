# Chapter 16 — Request Validation

## Log it

**1. Your job-posting service function receives a `deadline` field, already validated by the validation layer. What should the service do with it, and what does the boundary contract mean for layers below the route handler?**

Ans: the service layer trusts it and runs business logic without re-checking it. The boundary contract means every layer below the route handler can just use the value, since it's already been validated once at the boundary — no need to validate it again at every layer.

**2. A colleague says the database's NOT NULL and CHECK constraints make a validation layer unnecessary. What can't the database catch that validation can, and what can't validation catch without the database?**

Ans: the database can't give good error messages (it just throws a raw error, not something user-friendly), can't handle business rules that change over time or need complex logic (like "deadline must be in the future"), and can't check things across tables. On the other side, validation alone can't catch race conditions like duplicate applications from two requests at the same time, and it can't check referential integrity (like whether a company_id actually exists) — those need an actual database check.

---

## Quick quiz

**Q1. `{ "deadline": "not-a-date" }` goes straight to a SQL INSERT into a `date` column. What error does Postgres return, who sees it, and what does it reveal?**

Ans: Postgres returns a raw db error with details like the column name, type, and error code. If it's not caught, this can end up shown directly to the user, which reveals internal system info like the database type, table/column names — stuff that shouldn't be exposed.

**Q2. Two applicants apply to the same job at the same time, both pass stateless schema validation. Which layer catches the duplicate, and what should the route handler do?**

Ans: the database catches it, specifically the UNIQUE (job_id, applicant_id) constraint, since validation alone doesn't check against existing data. When the route handler gets that constraint violation error back, it should catch it and return a friendly response (like a 409 Conflict with "you already applied"), not let the raw db error reach the user.

**Q3. Why can't TypeScript guarantee an HTTP POST body's fields match the expected types, and what mechanism provides that guarantee at runtime?**

Ans: TypeScript types only exist at compile time and get erased before the code runs. An HTTP body is just raw JSON coming from outside the app, so at runtime there's no type-checking happening on it — anyone could send any shape of data regardless of what the TypeScript type says. A runtime validation library like Zod is needed to actually check the data's shape when the request comes in, since that check has to happen at runtime, not compile time.
