# Data Model Sketch — Job Portal (Chapter 2)

> This is a relationship sketch only — not schema code, not a migration.
> Full column-level schema comes in Chapters 8–11.

## Core Entities & Links

```
COMPANIES → JOBS            (one company, many jobs)
APPLICANTS → APPLICATIONS   (one applicant, many applications)
JOBS → APPLICATIONS         (one job, many applications)
APPLICATIONS → SCREENING_ANSWERS
```

## Foreign Keys (the links the database will enforce)

| Relationship | Foreign Key |
|---|---|
| A job belongs to a company | `jobs.company_id → companies.id` |
| An application belongs to a job | `applications.job_id → jobs.id` |
| An application belongs to an applicant | `applications.applicant_id → applicants.id` |
| A screening answer belongs to an application | `screening_answers.application_id → applications.id` |

## Uniqueness Rule — "One Application Per Applicant Per Job"

This is enforced by a **composite uniqueness constraint** across two foreign keys on the `applications` table:

```
UNIQUE (applicant_id, job_id)
```

This guarantees the same applicant can never create two applications for the same job.

---

## Real-Columns vs JSONB Split — `jobs` table

**Real columns** (filtered, sorted, gated, or need uniqueness):
- `id`
- `company_id`
- `title`
- `status`
- `deadline`

**JSONB `attributes`** (per-role, display-only, varies wildly):
- `perks`
- `employment_type` *(only if never filtered on — move to a real column if the board gets filtered by it)*
- `tech_stack` / `commission_plan` (role-specific fields)
- `salary_band` *(reconsider — if the board is ever filtered by salary range, this should become a real column instead)*

**Rule applied:** *"Will any screen or rule ever need to find or block jobs by this field?"* → Yes = real column. No = JSONB.
