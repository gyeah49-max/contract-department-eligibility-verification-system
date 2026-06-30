import express from "express";
import { createServer as createViteServer } from "vite";
import app from "./api/index.js";

async function startDev() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server Ready] running on http://localhost:${PORT}`);
  });
}

startDev();