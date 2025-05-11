import fp from "fastify-plugin";
import mongo from "@fastify/mongodb";

export default fp(async (app) => {
  await app.register(mongo, {
    url: process.env.MONGO_URI,
    database: process.env.DB_NAME,
    forceClose: true,
  });
});
