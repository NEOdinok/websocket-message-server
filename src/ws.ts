import { WebSocketServer } from "ws";
import { FastifyPluginAsync } from "fastify";
import { ChangeStreamDocument, Collection, ResumeToken } from "mongodb";

const metaId = "messagesCursor";

type Message = {
  _id: string;
  text: string;
  createdAt: Date;
};

export const wsPlugin: FastifyPluginAsync = async (app) => {
  const port = Number(process.env.PORT_WS ?? 8080);
  const wss = new WebSocketServer({ port });
  app.log.info(`👂 WS server on ws://localhost:${port}`);

  const messagesCollection: Collection = app.mongo.db!.collection("messages");

  const meta = app.mongo.db!.collection<{ _id: string; token: ResumeToken }>(
    "cursorState"
  );

  const lastSavedEvent = await meta.findOne({ _id: metaId });
  const changeStream = messagesCollection.watch(
    [],
    lastSavedEvent ? { resumeAfter: lastSavedEvent.token } : {}
  );

  changeStream.on("change", async (change) => {
    if (hasFullDocument(change)) {
      console.log("💾 CHANGE", change.fullDocument?.text);

      const doc = change.fullDocument;
      wss.clients.forEach(
        (ws) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(doc))
      );
    }

    // Save resume token regardless of event type
    await meta.updateOne(
      { _id: metaId },
      { $set: { token: change._id } },
      { upsert: true }
    );
  });

  app.addHook("onClose", async () => {
    await changeStream.close();
    wss.close();
  });
};

function hasFullDocument<T>(
  change: ChangeStreamDocument<T>
): change is ChangeStreamDocument<T> & { fullDocument: T } {
  return (
    change.operationType === "insert" ||
    change.operationType === "update" ||
    change.operationType === "replace"
  );
}
