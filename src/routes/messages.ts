import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { MessageBuffer } from "../buffer.js";

const schema = z.object({ text: z.string().min(1) });

const messagesRoute: FastifyPluginAsync = async (app) => {
  const collection = app.mongo.db!.collection("messages");
  const buffer = new MessageBuffer(collection);

  app.post("/messages", async (req, reply) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) return reply.code(422).send(parsed.error);

    buffer.push({ ...parsed.data, createdAt: new Date() });

    return reply.code(201).send({ ok: true });
  });

  app.get("/messages", async (_, reply) => {
    const list = await collection.find().sort({ _id: 1 }).toArray();

    return reply.send(list);
  });

  app.addHook("onClose", (_, done) => {
    buffer.flush().finally(() => done());
  });
};

export default messagesRoute;
