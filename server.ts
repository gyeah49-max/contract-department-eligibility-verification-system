import express from "express";
import { createServer as createViteServer } from "vite";

async function startDev() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  const { app } = await import("./api/index.js");
  app.use(vite.middlewares);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server Ready] running on http://localhost:${PORT}`);
  });
}

startDev();