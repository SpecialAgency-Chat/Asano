import { Hono } from "hono";
import interactionsRouter from "./interactions";

const app = new Hono();

app.get("/", (c) => c.text("Hello World!"));

app.route("/interactions", interactionsRouter);

export default app;