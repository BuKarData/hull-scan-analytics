import { Router } from "express";
import { store } from "../store.js";

export const scansRouter = Router();

scansRouter.get("/:id", (req, res) => {
  const entry = store.getScan(req.params.id);
  if (!entry) return res.status(404).json({ error: "Nie znaleziono skanu" });
  res.json(entry.scan);
});
