import { buildApp } from "./app";

const app = buildApp();

const PORT = 3000;

app.listen({port: PORT}, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})