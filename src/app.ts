
import fastify from "fastify";

export function buildApp(){
const app = fastify();

// Infrastructure ----------------------
app.get('/health', async(_request, reply) => {
    return reply.send({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

app.get('/', async(request, reply) => {
    return {status: 'ok'}
})

return app
}