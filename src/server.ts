
import { buildApp } from "./app";
import { config } from './shared/config';

const app = buildApp();

// const PORT = 3000;

app.listen({port: config.PORT}, () => {
    console.log(`Server running on http://localhost:${config.PORT}`)
})