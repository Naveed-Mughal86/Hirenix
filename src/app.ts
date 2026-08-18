import fastify from "fastify";

export function buildApp(){
const app = fastify();

app.get('/', async(request, reply) => {
    return {status: 'ok'}
})

return app
}