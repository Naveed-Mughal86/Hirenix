The applications table

CREATE TABLE applications (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid        NOT NULL REFERENCES jobs(id),
  applicant_id      uuid        NOT NULL REFERENCES applicants(id),
  stage             text        NOT NULL DEFAULT 'applied'
                                  CHECK (stage IN (
                                    'applied', 'screening', 'interview',
                                    'final_interview', 'offer',
                                    'hired', 'rejected'
                                  )),
  screening_answers jsonb       NOT NULL DEFAULT '{}',
  profile_snapshot  jsonb       NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);

"Rationale for UNIQUE (job_id, applicant_id)"
----> This ensures that one applicant can apply for one job only once means (one application per applicant per job) if we do not enforce it then any network retry or bug can create duplicate applications.

"Shape of one example screening_answers object"
----> {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": "3 saal ka experience hai",
  "b2c3d4e5-f6a7-8901-bcde-f12345678901": true
}

"Seven stage values in pipeline order"
----> applied → screening → interview → final_interview → offer → hired
The hired stage is only reachble after offer stage but rejected stage can be reachable from any active stage

# Chapter 10 — Modeling Applications

## Definition of Done

- [✅] You can name all columns in `applications` and state whether each is relational or JSONB — with a reason for each.
- [✅] You can explain why the application unit is per-job, not per-company.
- [✅] You can draw the FKs: `applications.job_id → jobs.id` and `applications.applicant_id → applicants.id`.
- [✅] You can explain what `UNIQUE (job_id, applicant_id)` prevents and why the schema-level constraint is needed even when the application layer also checks.
- [✅] You can describe the shape of `screening_answers` — what the keys are, what the values are, and how they relate to `jobs.screening_questions`.
- [✅] You can name all seven `stage` values in pipeline order and explain why `stage` is a real column rather than JSONB.
- [✅] The `applications` DDL, an example `screening_answers` object, and the stage pipeline are written in your learning log.

---

## Log it

**1. A teammate proposes storing `stage` in the `screening_answers` JSONB object to keep the application record "self-contained." What is the specific schema-level problem?**

If stage is buried in jsonb, it can't be filtered on properly. A recruiter needs to filter "show me all applications in the interview stage," and that's exactly the kind of thing that decides column vs jsonb — if a field is filtered, sorted, or gated on, it belongs in a real column, not jsonb.

**2. An applicant submits their shortlist. The request times out before they get a response. They click submit again. Walk through exactly what happens at the database level.**

A timeout doesn't mean the request failed — it means the client never got the response, but the first request may have already succeeded on the server and created the application. So when the applicant clicks submit again, the second insert attempt hits `UNIQUE (job_id, applicant_id)` and the database throws a duplicate-key error, since that pair already exists from the first (successful) attempt. The application layer needs to catch that specific constraint violation and treat it as "you already applied" instead of surfacing it as a scary 500 error to the user.

**3. A recruiter corrects a typo in a screening question's text after 12 applications have been submitted. Do those 12 `screening_answers` records change?**

No, they don't change at all. The answers are keyed by the question's UUID, not by its text, so editing the question's wording doesn't affect anything already stored under that UUID. This is safe because of the ch9 decision to use UUIDs for question ids instead of something like the question text or a position-based slug.

---

## Quick quiz

**1. An applicant applies to two jobs at the same company. How many rows does the `applications` table gain?**

2 rows — one per job, since the application unit is per-job. If it were a per-company model instead, it would only gain 1 row for both jobs combined.

**2. What does `UNIQUE (job_id, applicant_id)` prevent that `NOT NULL` on both columns alone does not?**

`NOT NULL` only guarantees that a job and an applicant are both present on the row — it says nothing about duplicates. `UNIQUE (job_id, applicant_id)` is what actually stops the same applicant from applying to the same job twice, enforcing one application per applicant per job.

**3. Describe in one sentence how the query retrieves screening questions and their answers from the two separate JSONB columns.**

The query walks each question object in `jobs.screening_questions`, and for every question's `id` (a UUID), it looks up that same UUID as a key inside `applications.screening_answers` to pull the matching answer — the UUID is what links a question to its answer across the two separate JSONB columns.