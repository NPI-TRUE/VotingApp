import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCandidateSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/candidates", async (req, res) => {
    const candidates = await storage.getCandidates();
    res.json(candidates);
  });

  app.post("/api/candidates", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const parsed = insertCandidateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const candidate = await storage.createCandidate(parsed.data);
    res.status(201).json(candidate);
  });

  app.delete("/api/candidates/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    await storage.deleteCandidate(Number(req.params.id));
    res.sendStatus(200);
  });

  app.post("/api/vote/:candidateId", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Authentication required");
    }

    try {
      await storage.vote(req.user.id, Number(req.params.candidateId));
      const updatedUser = await storage.getUser(req.user.id);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).send((error as Error).message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
