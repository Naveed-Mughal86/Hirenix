# 03 — Choosing Your Stack: ADR & Takeaways

## Part A — The Decision

### 1. Your stack, recorded

- **Web framework — Fastify.** Chosen because it's fast, has first-class TypeScript support, and ships with built-in schema-based validation hooks. Trade-off: less "batteries-included" structure than NestJS, so architecture discipline is on me.
- **Database access — Query Builder (e.g., Kysely/Knex-style).** Chosen because it generates SQL from typed function calls while keeping the actual SQL visible — unlike an ORM, which abstracts the database away and hides what's really being executed. Trade-off: more manual work than an ORM for common CRUD patterns.
- **Validation library — Zod.** Chosen because it's a runtime schema validation library that also infers TypeScript types from the same schema, so the compile-time type and the runtime check never drift apart. Trade-off: an extra schema-definition step instead of relying on decorators/annotations.
- **Given base — Node + TypeScript, PostgreSQL, Redis, BullMQ, S3-compatible storage.** Accepted as-is per course spec.

### 2. The pick you debated most

Fastify vs. NestJS was the closest call. NestJS is heavily structured (modules, decorators, dependency injection out of the box), which is great for large teams but means a lot of the underlying wiring is done *for* you. Since the goal right now is to actually learn what's happening under the hood — routing, validation, request lifecycle — Fastify won: it gives structure without hiding the mechanics.

## Part B — The Concepts It Rests On

### 3. TypeScript vs JavaScript

TypeScript is JavaScript with a type system layered on top, checked at compile time. Concrete bug: if a screening answer's total is accidentally handled as the string `"3"` instead of the number `3`, TypeScript flags the type mismatch before the code ever runs. Plain JavaScript would let that bad value flow silently all the way through to the applicant.

### 4. The framework axis

The "minimal ↔ batteries-included" axis describes how much a framework decides for you versus leaves for you to decide. Express sits at the minimal end — fast, flexible, but with a lot of freedom that can turn into messy, undisciplined code if you're not careful. NestJS sits at the batteries-included end — modules, decorators, and conventions are baked in, which enforces structure but adds abstraction. Fastify sits in between, closer to minimal: it's fast and TypeScript-friendly, and it suits this project because the priority right now is understanding the mechanics, not inheriting a full opinionated architecture.

### 5. The database-access spectrum

- **Raw SQL** — you write every query by hand; full visibility, zero abstraction.
- **Query builder** — generates SQL from typed function calls; you still see and control the SQL, just with type safety and less string-writing.
- **ORM** — generates SQL from object/model definitions; the SQL is hidden behind the abstraction.

Specific danger of a full ORM without watching the generated SQL: it can quietly issue one query per item inside a loop — the classic **N+1 query problem** — which is invisible in the code but devastating for performance at scale.

### 6. Runtime validation

TypeScript types only exist at compile time — once the code is compiled to JavaScript, the types are erased and nothing is left to check the actual data arriving in a request at runtime. A schema library like Zod fills that gap: it validates the real, incoming data as the program runs, catching malformed or unexpected payloads that TypeScript's compile-time types can never see.

### 7. Redis's double duty

Redis plays two distinct roles in this stack:

1. **Cache** — storing frequently-read data (e.g., job listings, session/auth lookups) in memory so repeated reads skip hitting PostgreSQL.
2. **Queue backend for BullMQ** — Redis is the data store BullMQ uses to manage background job queues (e.g., sending emails, processing uploads), which the job-processing module relies on directly.

---

## Quick Quiz

1. **False.** TypeScript types are erased at compile time and do not check actual runtime request-body data.
2. **NestJS** is the most batteries-included of Express, Fastify, and NestJS.
3. **ORM** is most likely to hide an N+1 query.
4. Zod runs **at runtime** (though it can also drive compile-time type inference via its schema).
5. Redis plays two roles here: **caching** frequently-read data, and acting as the **queue backend for BullMQ**.
