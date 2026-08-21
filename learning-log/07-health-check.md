# Chapter 7 — The Health Check Endpoint

## Definition of Done

- [✅] `GET /health` is registered in `src/app.ts`, not inside a feature module.
- [✅] The endpoint returns HTTP 200 with a JSON body containing `status`, `uptime`, and `timestamp`.
- [✅] `curl http://localhost:<PORT>/health` returns the expected JSON — status code confirmed as `200`.
- [✅] `curl http://localhost:<PORT>/nonexistent` returns `404` — the 200 is specific, not a default.
- [✅] The health handler makes no database or Redis calls.
- [✅] `npm run dev` still starts cleanly — no regressions from adding the route.

---

## Log it

**1. Why is the health check wired directly in `app.ts` rather than inside a module under `src/modules/`?**

Ans: because it is not a feature or a module it is a signal from the process about the process itself. It is just to check whether the process is alive or not so it is wired in app.ts before the routes and also check if a non-existent route is called.

**2. Imagine you had added a `SELECT 1` to the health check handler. The database goes down. Walk through exactly what happens to the running process — step by step — and explain why that's a worse outcome than if the health check hadn't queried the database at all.**

Ans: if db is queried then the health check may return a 500. An orchestrator can say process is unhealthy leading to restart of process that actually won't help. It's a worse outcome because a health check should not query the db at all, its concern should be about whether the process is alive or not.

**3. What is the difference between a liveness probe and a readiness probe? Which one did you just build, and which chapter builds the other?**

Ans: a liveness probe means whether a process is alive or processing or not and a readiness probe concerns about whether a process is ready to accept real requests or not. We build liveness probe and in chapter 72 we will build readiness probe.

---

## Quick quiz

**1. A load balancer checks `GET /health` on each instance every five seconds. Instance A returns 200. Instance B returns 503. What does the load balancer do — and what would happen if there were no `/health` route at all?**

Ans: load balancer will route traffic to only instance A that returns 200 and remove the rest. If there were no /health route then it would continue routing traffic to the instances that are returning non-200.

**2. Your infrastructure team adds a CDN in front of the service that caches all GET responses for 30 seconds to reduce load. What specific problem does this create for the `/health` endpoint — and what field in the response body would expose it?**

Ans: if the CDN caches /health for 30 seconds, the response becomes stale so an unhealthy instance could still show as healthy for those 30 seconds. The timestamp field would expose this because it won't update on every request, it'll stay the same for 30 seconds even though real time has passed.

**3. A teammate suggests adding a database `SELECT 1` to the health check "so we know the whole stack is healthy." What specific failure mode does that introduce? How would you address the underlying concern differently?**

Ans: it introduces the same failure mode as before, the process would get restarted for a db issue when restarting doesn't fix anything, and could cause repeated restarts while the db stays down. To address the concern differently, add a separate readiness probe that checks the db, and keep the liveness check only checking if the process itself is alive.
