# 04 — Project Bootstrap

## Checklist

- [✅] `npm run dev` starts the app and it stays up, serving a placeholder response at `/`
- [✅] `tsconfig.json` has `"strict": true`, with `rootDir: src` and `outDir: dist`
- [✅] `npm run build` compiles `src/` into `dist/`, and `npm start` runs the compiled output
- [✅] `dev`, `build`, `start`, and `typecheck` scripts exist, and I can explain how `dev` and `start` differ
- [✅] The project uses feature/module-based structure: `src/modules/{auth, companies, jobs, applications, applicants, admin}/` each with its four files, plus `src/shared/` placeholders
- [✅] `app.ts` (wiring) is split from `server.ts` (listening)
- [✅] `git init` done, a first commit made, and `.gitignore` excludes `node_modules/`, `dist/`, and `.env`
- [✅] No secrets committed

## Log

### 1. Which folder structure did you choose, and why?

I chose a **feature/module-based structure** because it's a cleaner way to add and update files — everything about one thing lives together. If I add or change a feature in a feature/module structure, I don't have to search across the project for where it lives; I only make changes inside one module folder, and it's easy for any other developer to locate and edit. For example, if I need to add a new field to job applications, in a feature-based structure I just open `src/modules/applications/` and everything relevant (routes, service, schema, types) is right there. In a layered structure, the same change would mean touching `controllers/applications.ts`, `services/applications.ts`, `routes/applications.ts`, and `models/applications.ts` across four separate top-level folders — more jumping around and a much easier place for a mess to grow as the project scales.

### 2. Why keep TypeScript `strict` mode on — what does it catch, and when?

Strict mode should be kept on to strictly enforce type safety — that's the whole reason for using TypeScript in the first place. It catches things like a missing or possibly-`undefined` value (e.g., an undefined `companyId`) at **compile time**, before the developer even runs the code — instead of that bug surfacing at **runtime**, potentially in front of a recruiter or a real user.

### 3. What's the difference between how your app runs in development (`dev`) versus production (`start`)?

In `dev`, the app runs TypeScript directly (via `tsx`) for fast feedback with hot reload — it doesn't write compiled JavaScript to disk. In `start`, the app runs the already-compiled JavaScript from `dist/` (produced by `npm run build`) — this is what actually runs in production.

### 4. Why split `app.ts` from `server.ts` — what does it buy you in Chapter 30?

All the wiring and building of the framework happens in `app.ts` — registering middleware, mounting routes — but it never listens on a port. `server.ts` imports the built app and is the only place that calls `.listen()`, starting the server. In Chapter 30, I'll need to fire fake requests at the app to test that one Company can't see another Company's data. Because `app.ts` and `server.ts` are split, the test can import `buildApp()` and inject fake requests directly, without opening a real network port — faster, no port clashes, and it runs anywhere.

## Quick quiz

1. **Why is feature/module-based structure required rather than just recommended?**
   Because the whole project is built to line up with it — every chapter from here assumes this structure. I just open the specific module I want to change instead of searching for it across multiple folders.

2. **What does `"strict": true` catch, and at what moment — compile time or runtime?**
   It catches type-safety issues like an undefined `companyId`, and it catches them at **compile time**.

3. **Which script runs your `.ts` directly with reload, and which runs the compiled `.js`?**
   `dev` runs the TypeScript directly with reload; `start` runs the compiled `.js`.

4. **Which file listens on a port — `app.ts` or `server.ts` — and why is that separation useful for testing?**
   `server.ts` listens on a port. The separation is useful because tests can send fake requests straight to the app built by `app.ts`, without needing a real port.

5. **Name two things `.gitignore` must exclude and why each one belongs there.**
   - `.env` — it holds secrets (API keys, DB credentials, etc.) that must never be committed to version control.
   - `node_modules/` — it's regenerable via `npm install` from `package.json`/lockfile, and committing it would bloat the repo with unnecessary, machine-specific files.
