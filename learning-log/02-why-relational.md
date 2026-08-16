
\ Chapter 2 — Why Relational

## Part A — The Decision

### 1. Why this database, for this project

I chose a relational database for my job portal because two requirements drove the decision hardest.

First, **application submission must be atomic**. When an applicant applies from a shortlist spanning multiple companies, several things must happen together — creating the application, snapshotting the resume, saving screening answers, and bumping the job's applicant counter. If any one of these fails partway, I'd end up with a corrupted state (e.g., a counter incremented with no matching application). Relational databases give me this all-or-nothing guarantee natively through transactions.

Second, **the portal constantly reads across relationships** — a recruiter viewing their dashboard needs applicants, jobs, and companies joined together in one view. This kind of cross-table querying is fast and natural in a relational database, but becomes slow and manual when data is scattered across independent documents.

### 2. Where you'd lose — and why you still don't switch

A pure document model would genuinely fit better for a job's **detail page** — the title, description, and per-role attributes (like `tech_stack` for an engineering role or `commission_plan` for a sales role). This data is self-contained, read as a whole, rarely joined to anything else, and varies wildly from one role to the next — exactly the shape a document is built for.

Even so, I won't add a second database for this. Postgres's **JSONB** column type gives me that same flexibility *inside* my relational `jobs` table — I can keep `id`, `company_id`, `status`, and `deadline` as real, enforced columns, while parking the free-form per-role data in a JSONB `attributes` field. This means I get both worlds in one database, without the operational cost of running and syncing two separate systems for one use case.

---

## Part B — Explain It

### 3. Relational vs document

Relational databases store data as **tables of rows and columns**, where related data lives in separate tables and is connected through foreign keys. The database itself **enforces** structure: data types, uniqueness, NOT NULL constraints, foreign key relationships, and transactional (ACID) guarantees.

Document databases store data as **self-contained JSON-like documents**, where related data is often nested inside a single document rather than split across tables. These databases stay schema-flexible — they enforce far less at the database level, leaving relationships, data validation, and consistency rules mostly to the **application code**.

### 4. Transactions & atomicity

A transaction is a way to bundle multiple steps into a single all-or-nothing unit — either every step commits, or none of them affect the database.

In my application submission flow (a shortlist spanning two companies becoming one application per job), atomicity means all the related writes — creating each application, snapshotting the resume, saving screening answers, and bumping each job's counter — must succeed together. Without atomicity, I'd risk an exact bad state: the application for job_55 gets created successfully, but the process fails before job_91's application is written — or a job's applicant counter increments even though no matching application actually exists. That's a corrupted, inconsistent state that should never be possible.

### 5. Foreign keys & referential integrity

A foreign key guarantees that a value in one table must correspond to an existing value in another table — this is called **referential integrity**.

Using `applications.job_id → jobs.id`, the database will now refuse to:
1. **Insert an application** with a `job_id` that doesn't exist in the `jobs` table (e.g., applying to a non-existent job).
2. **Delete a job** that still has applications referencing it, unless an explicit cascade/delete rule is set up — protecting against orphaned applications.

### 6. Joins

A join is a way to combine rows from two or more tables in a single query, based on a matching column (usually a foreign key).

My portal's **job search and filter screen** needs a join constantly — it touches the `jobs` table (job details) and the `companies` table (company name, logo). Without a join, I'd have to run two separate queries and then manually match jobs to their companies in application code — slower, more error-prone, and harder to filter or sort correctly in one pass.

### 7. The JSONB hybrid

Postgres lets me keep relational guarantees while storing wildly varying per-role attributes through the **JSONB** column type — a binary, indexable JSON format stored inside a normal relational row.

For my `jobs` table:
- **Real columns:** `title` (searched and displayed on every listing) and `status` (filtered constantly — "show only open jobs"). Both are things I filter, sort, or gate on, so they need real columns and, later, indexes.
- **JSONB `attributes`:** `perks` (only ever displayed on the detail page, never filtered) and `employment_type` when it's purely informational (only relevant if I never filter the whole board by it — if I do, it should move to a real column instead).

The rule I'm applying: if a field is used to **filter, sort, or gate** access, it earns a real column. If it's only ever **displayed**, it belongs in JSONB.
