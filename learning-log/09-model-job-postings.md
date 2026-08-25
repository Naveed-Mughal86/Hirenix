The jobs table

CREATE TABLE jobs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        NOT NULL REFERENCES companies(id),      ON DELETE RESTRICT
  title               text        NOT NULL,
  description         text        NOT NULL,
  status              text        NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft', 'open', 'closed')),
  deadline            date,
  attributes          jsonb       NOT NULL DEFAULT '{}',
  screening_questions jsonb       NOT NULL DEFAULT '[]',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

Going through the fields

Field	            Real column or JSONB?	Reason
company_id	        Real column	        Foreign key — enforces ownership; every query that scopes jobs to a company filters on this
title	            Real column	        Displayed in listings; sorted; full-text searched (ch39)
description	        Real column	        Every job has one; it doesn't vary by role type — it's a standard part of every posting
status	            Real column	        Gated: only open jobs accept applications; the public board filters on status = 'open' in every query
deadline	        Real column	        Compared: deadline > NOW() is a WHERE clause condition; the value must be correct and queryable
tech_stack	        JSONB (attributes)	Engineering-role-specific; never filtered across all jobs; only displayed on the job detail page
commission_plan	    JSONB (attributes)	Sales-role-specific; same reasoning
portfolio_required	JSONB (attributes)	Design-role-specific; same reasoning
Screening questions	Separate JSONB column	Structured but per-job; always loaded with the job; never queried independently


Log it
In learning-log/09-model-job-postings.md, answer:

1. status is a real column. attributes is JSONB. Apply the column-vs-JSONB rule to justify both decisions in one paragraph.
Ans: status is a real column because it is an important field used for filtering and controlling whether a job is draft, open, or closed. attributes contains flexible, display-only data that is not commonly filtered, so JSONB is more suitable for it.

2. A product manager asks you to add a "Remote only" filter to the job board. The remote_policy field currently lives in attributes JSONB. What change does that filter require — schema-level, query-level, and migration? Walk through each step.
Ans:    Schema: Move remote_policy from attributes JSONB to a real column.
        Query: Filter jobs using WHERE remote_policy = 'remote'.
        Migration: Add the new column and copy existing remote_policy values from JSONB into it.

3. Explain why the screening_questions question id field must remain stable after an applicant submits their answers. What breaks if a recruiter edits the question text and the id changes?
Ans: The ID is the permanent identity of a question and is used to link applicants' answers to that question. If the ID changes, existing answers can become disconnected or misattributed. UUIDs provide stable IDs even when questions are edited, deleted, or reordered.

Quick quiz
1. A recruiter creates a job. What is status set to by default — and why isn't it 'open' immediately?
Ans: The default status is draft because the recruiter may still be editing the job. It should only become open when the recruiter explicitly publishes it.

2. deadline is nullable. Write the SQL WHERE clause for "show only jobs that are open and whose deadline has not yet passed" — handling the case where deadline might be NULL.
Ans: WHERE status = 'open'
  AND (deadline IS NULL OR deadline >= CURRENT_TIMESTAMP)

3. A recruiter adds a new question to a live job posting after three applications have already been submitted. The new question's id is "q4". What value will those three existing applications have for q4 in their stored answers — and is that a problem?
Ans: The existing applications will have no answer for q4 because the question did not exist when they applied. This is not a problem; their previous answers remain unchanged.