import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { runMigrations } from "../migrate";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Run database migrations before starting the server
  try {
    await runMigrations();
  } catch (error) {
    console.error("[Server] Failed to run migrations, but continuing startup:", error);
  }

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Local artifact serving (fallback when storage proxy/S3 is unavailable)
  app.get("/api/local-artifacts/:id/:name", async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const nodePath = await import("path");
      const { id, name } = req.params;
      const safeName = String(name || "").replace(/[^a-zA-Z0-9._-]+/g, "_");
      const filePath = nodePath.join("/tmp/oracle_local_artifacts", `${id}_${safeName}`);
      const data = await fs.readFile(filePath);
      // best-effort content type
      const ct = safeName.endsWith(".json")
        ? "application/json"
        : safeName.endsWith(".md")
          ? "text/markdown"
          : safeName.endsWith(".txt")
            ? "text/plain"
            : "application/octet-stream";
      res.setHeader("Content-Type", ct);
      res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);
      res.send(data);
    } catch (e) {
      res.status(404).json({ error: "Artifact not found" });
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
