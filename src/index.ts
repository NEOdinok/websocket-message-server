import Fastify from "fastify";
import dotenv from "dotenv";
import db from "./db.js";
import messagesRoute from "./routes/messages.js";
import { wsPlugin } from "./ws.js";

dotenv.config();
const port = Number(process.env.PORT_HTTP ?? 3000);

const app = Fastify({ logger: true });

await app.register(db);
await app.register(messagesRoute);
await app.register(wsPlugin);

app.listen({ port }, (err) => {
  if (err) throw err;
  app.log.info(`HTTP → http://localhost:${port}`);
});

async function gracefulShutdown() {
  await app.close(); // buffer.flush() через onClose
  process.exit(0);
}

process.once("SIGINT", gracefulShutdown).once("SIGTERM", gracefulShutdown);
