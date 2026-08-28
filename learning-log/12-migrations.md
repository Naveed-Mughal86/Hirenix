# Chapter 12 — Migrations

## Checklist

- [✅] `node-pg-migrate` is installed and `npm run migrate`, `npm run migrate:down`, and `npm run migrate:create` all resolve without "command not found" errors.
- [✅] Seven migration files exist in the `migrations/` directory, one per table, in dependency order.
- [✅] `npm run migrate` runs cleanly — all seven migrations succeed and the output lists each file as applied.
- [✅] `\dt` in `psql` shows all seven tables plus `pgmigrations`. No tables are missing.
- [✅] `npm run migrate:down` followed by `npm run migrate` works — rolling back the most recent migration and reapplying it produces the same clean state.
- [✅] Migration files are committed to git. Running `git status` shows a clean tree after committing the `migrations/` directory.

---

## Log it

**1. The `down` function for `create_applications` must drop the table before `create_jobs` can also be dropped. Why — and what does this tell you about the order in which `down` migrations must run relative to `up` migrations?**

`applications` references `jobs` via a foreign key, so `jobs` cannot be dropped while `applications` still exists and points to it — the FK would block the drop. This tells us that `down` migrations must run in the exact reverse order of `up` migrations: whichever table was created last (and therefore depends on earlier tables) must be dropped first. So the teardown order mirrors the build order, just backwards.

**2. Your team adds a new column next week: `jobs.salary_range jsonb`. Write the `up` and `down` bodies.**

```ts
import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`ALTER TABLE jobs ADD COLUMN salary_range jsonb`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`ALTER TABLE jobs DROP COLUMN salary_range`);
}
```

---

## Quick quiz

**Q1. You run `npm run migrate` twice in a row without changing any files. What happens on the second run, and why?**

The second run prints "no migrations to run." The tool checks the `pgmigrations` tracking table, sees every migration file is already recorded as applied, and since nothing new exists to run, it does nothing.

**Q2. Two developers each create migration `008_...` on different branches, then merge to main. What problem does this cause, and how does timestamp-based naming avoid it?**

Both files share the same sequential prefix `008`, so once merged, the migration order becomes ambiguous — the tool (and any human reading the folder) can't tell which one is meant to run first. Timestamp-based naming avoids this because a timestamp is generated at the exact moment the file is created, down to the millisecond, so two developers working independently will almost never produce the same prefix — each file naturally gets a unique, correctly ordered name regardless of merge order.

**Q3. You want to drop and recreate the `users` table from scratch. Why can't you run `DROP TABLE users` directly, and in what order would you run `migrate:down`?**

You can't run it directly because other tables (`recruiters`, `applicants`, `admins`) have foreign keys referencing `users.id` — Postgres will block the drop with a foreign key violation as long as those references exist. To reach a state where `users` can be dropped, you'd run `migrate:down` repeatedly, rolling back in the exact reverse of creation order: `applications` first, then `jobs`, then `recruiters`, `applicants`, and `admins`, then `companies` — six rollbacks in total — until `users` is the only table left with nothing referencing it, at which point dropping (or rolling back) it succeeds.
