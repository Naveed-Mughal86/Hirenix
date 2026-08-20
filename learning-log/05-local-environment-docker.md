# Chapter 5 — Local Environment & Docker

## Definition of Done

- [✅] Docker is installed; `docker --version` and `docker compose version` both work
- [✅] A `docker-compose.yml` defines a Postgres and a Redis service
- [✅] Both images are pinned (no `:latest`); Postgres matches the major version used in production
- [✅] Postgres has a named volume, and data survives a `docker compose down` then `up` (and `down -v` wipes it)
- [✅] `docker compose up -d` starts both; `docker compose ps` shows them running
- [✅] `SELECT 1;` returns via `DATABASE_URL`; `redis-cli ping` returns `PONG` via `REDIS_URL`
- [✅] `.env` is git-ignored; no connection string or password is committed

---

## Log it

**(1) What is a container, and how is it different from an image?**

A container is a lightweight, isolated box that packages an application together with all its dependencies, running on the host machine but walled off from it. An image is the read-only blueprint — a packaged, executable snapshot (e.g. "Postgres 16, configured like so") — while a container is a running instance of that image. One image can spin up many running containers, the same way one recipe can produce many cooked dishes.

**(2) Why run these services in Docker rather than installing them natively — name a failure it prevents.**

We run Postgres and Redis in Docker instead of installing them natively so we don't depend on whatever version our OS package manager happens to give us. This prevents **version drift** — a bug where my machine runs a different Postgres version than a teammate's or the production server's, causing bugs that reproduce on one machine but not another. Docker pins the exact version everyone uses, so the environment stays identical across machines.

**(3) What does a volume protect you from, and what's the difference between `docker compose down` and `down -v`? Commit it.**

A volume is storage that lives outside the container itself, so it protects our data from being lost when a container is removed or rebuilt — containers are disposable, volumes are not. `docker compose down` stops and removes the containers but leaves the volume (and its data) intact. `docker compose down -v` goes a step further and also deletes the volume, permanently wiping the data.

---

## Quick quiz

**1. An image is to a container as a recipe is to a ___ — fill the blank and say why one image can run as many containers.**

Answer: **dish**. A recipe is a fixed set of instructions, but you can cook it many times to produce many separate dishes — none of them affect each other or the recipe itself. Similarly, an image is a fixed, read-only blueprint, and Docker can spin up many independent running containers from that same image. Each container gets its own isolated filesystem layer on top of the image, so starting a second or third container never modifies the image or any other container.

**2. Why pin `postgres:16` instead of `postgres:latest`?**

If we use `:latest`, a silent new major version could get pulled at any time (by us or a teammate), quietly changing behavior and breaking reproducibility — the same `docker-compose.yml` could produce a different Postgres version on different machines or at different times. Pinning `postgres:16` guarantees everyone (dev machines, CI, and production) runs the exact same version, avoiding version-drift bugs and surprises.

**3. Your `DATABASE_URL` uses host `localhost` — why, and what would the host become once the app itself runs inside Docker?**

`localhost` works right now because the client running the query (`psql`, or later our Node.js app) is running **on the host machine**, outside any container. Docker Compose maps the Postgres container's internal port 5432 out to `localhost:5432` on the host, so anything on the host machine can reach it there.

Once the app itself is moved into its **own container** (running alongside Postgres and Redis under the same `docker-compose.yml`), `localhost` inside that app container would no longer point to the Postgres container — it would point to the app container itself. Docker Compose gives each service a **DNS name equal to its service name** on an internal network, so the host in `DATABASE_URL` would need to change to the Postgres service's name as defined in `docker-compose.yml` (e.g. `postgres` or `db`), not `localhost`.

**4. You ran `docker compose down -v` and your data vanished. What did the `-v` do, and which command keeps the data?**

The `-v` flag told Docker to remove the named volume along with the containers, permanently deleting the data stored in it. Plain `docker compose down` (without `-v`) keeps the data — it only removes the containers, leaving the volume (and everything in it) intact for the next `docker compose up`.

**5. `psql` says "connection refused" the instant after `up`. What's the most likely cause, and what feature removes this race during automated startup?**

The most likely cause is that the Postgres container has started but the Postgres server process inside it hasn't finished initializing yet — there's a brief window where the container is "running" but not yet ready to accept connections. A Docker Compose **healthcheck** removes this race: it lets other services (or startup scripts) wait until Postgres reports itself as actually ready, instead of assuming "container running" means "server ready."
