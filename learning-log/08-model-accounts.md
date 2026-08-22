The auth anchor — the users table

CREATE TABLE users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,   -- salted slow hash; hashing covered in ch19
  role          text        NOT NULL
                              CHECK (role IN ('recruiter', 'applicant', 'admin')),
  status        text        NOT NULL DEFAULT 'unverified'
                              CHECK (status IN ('active', 'unverified', 'suspended')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

Companies

CREATE TABLE companies (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL,
  slug       text    NOT NULL UNIQUE,   -- URL-friendly: 'acme-corp', 'nova-labs'
  website    text,
  verified   boolean NOT NULL DEFAULT false,
  suspended  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

Recruiters

CREATE TABLE recruiters (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_id   uuid NOT NULL REFERENCES companies(id),
  company_role text NOT NULL DEFAULT 'recruiter'
                 CHECK (company_role IN ('owner', 'hr_manager', 'recruiter', 'hiring_manager')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

Applicants

CREATE TABLE applicants (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name  text  NOT NULL,
  headline   text,
  location   text,
  attributes jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

Admins

CREATE TABLE admins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

# Chapter 8 — Definition of Done & Log

## Definition of Done

- [✅] You can name all five tables (`users`, `companies`, `recruiters`, `applicants`, `admins`) and state in one sentence what each stores.
- [✅] You can draw the FK relationships from memory: which table's column references which other table's `id`.
- [✅] You can explain why there is a `users` table separate from the profile tables — specifically what problem it solves for auth.
- [✅] You can explain why `company_id` lives on `recruiters`, not on `users`.
- [✅] You can explain the "one account, one role" decision: what it means, what it trades off, and what a migration away from it would look like.
- [✅] You have the full schema written in your learning log — five DDL blocks with every column, type, and constraint.

---

## Log it

**1. Single users table with nullable company_id, full_name, headline — what's the problem?**

If full_name is NULL on a recruiter row, the db can't tell if that's normal (recruiters just don't need a name) or a bug (someone forgot to fill it in). NOT NULL only works when a column always applies to every row in that table. Mixing roles in one table means every role-specific column has to be nullable, so the db loses its ability to enforce "this field is required" for anyone.

**2. Company suspended, has 8 recruiters — what happens in the db?**

Just one row changes: `companies.suspended` gets set to true for that one company. Nothing in `recruiters` or `users` needs to change — the recruiters still exist, their accounts are still fine, they just now belong to a suspended company. Any place that checks "can this company post jobs" checks the companies row, not each recruiter individually. That's why suspended lives on companies — it's a company-level fact, not a per-recruiter one, so it only needs to be set in one place.

**3. Why CASCADE on recruiters.user_id but not on recruiters.company_id?**

A recruiter profile has no meaning without the user account behind it, so deleting the user should delete the recruiter row too — CASCADE makes sense there. But a company shouldn't just vanish along with all its recruiters' data getting silently deleted the moment one recruiter row is affected — company deletion is a bigger decision (what happens to jobs, other recruiters, etc), so it's deliberately left undecided here instead of defaulting to CASCADE. If CASCADE was added to company_id, deleting a company would auto-delete every recruiter tied to it, which could wipe a lot of unrelated user data as a side effect of removing one company.

---

## Quick quiz

**1. Admin hard-deletes a recruiter's users row — what happens to recruiters?**

The recruiter's row in `recruiters` gets deleted too, automatically. This is governed by `ON DELETE CASCADE` on `recruiters.user_id`.

**2. Recruiter leaves, their users row is suspended — does companies change? Does the jobs listing change?**

No, companies doesn't change — the company itself didn't do anything wrong. Jobs listing doesn't change either, since jobs belong to the company, not to that one recruiter. Suspending a user just blocks that one person from logging in.

**3. job_title on users or on recruiters?**

recruiters. job_title only makes sense for someone who is a recruiter — an applicant or admin has no job title within a company. Putting it on users would make it nullable for two out of three roles, same problem as question 1.