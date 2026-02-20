import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { appendActivity } from "./lib/activity";

function makeDocId() {
  return `DOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const list = query({
  args: {},
  handler: async (ctx) => (await ctx.db.query("documents").collect()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
});

export const create = mutation({
  args: { title: v.string(), url: v.optional(v.string()), note: v.optional(v.string()), now: v.string(), uploadedByType: v.optional(v.union(v.literal("user"), v.literal("icarus"), v.literal("other"))), uploadedByName: v.optional(v.string()), uploadedByEmail: v.optional(v.string()), uploadedByImage: v.optional(v.string()) },
  handler: async (ctx, a) => {
    return await ctx.db.insert("documents", {
      docId: makeDocId(),
      title: a.title,
      url: a.url,
      note: a.note,
      uploadedByType: a.uploadedByType,
      uploadedByName: a.uploadedByName,
      uploadedByEmail: a.uploadedByEmail,
      uploadedByImage: a.uploadedByImage,
      createdAt: a.now,
      updatedAt: a.now,
    });
  }
});

export const upload = mutation({
  args: {
    title: v.string(),
    fileName: v.string(),
    fileType: v.union(v.literal("text/plain"), v.literal("text/markdown"), v.literal("image/png")),
    dataUrl: v.string(),
    note: v.optional(v.string()),
    now: v.string(),
    uploadedByType: v.optional(v.union(v.literal("user"), v.literal("icarus"), v.literal("other"))),
    uploadedByName: v.optional(v.string()),
    uploadedByEmail: v.optional(v.string()),
    uploadedByImage: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const lower = a.fileName.toLowerCase();
    const okExt = lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".png");
    if (!okExt) throw new Error("Unsupported file extension. Allowed: .txt, .md, .png");

    const id = await ctx.db.insert("documents", {
      docId: makeDocId(),
      title: a.title,
      fileName: a.fileName,
      fileType: a.fileType,
      dataUrl: a.dataUrl,
      note: a.note,
      uploadedByType: a.uploadedByType,
      uploadedByName: a.uploadedByName,
      uploadedByEmail: a.uploadedByEmail,
      uploadedByImage: a.uploadedByImage,
      createdAt: a.now,
      updatedAt: a.now,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, a) => {
    await ctx.db.delete(a.id);
    return true;
  }
});

export const createProjectSummary = mutation({
  args: {
    title: v.optional(v.string()),
    now: v.string(),
    uploadedByType: v.optional(v.union(v.literal("user"), v.literal("icarus"), v.literal("other"))),
    uploadedByName: v.optional(v.string()),
    uploadedByEmail: v.optional(v.string()),
    uploadedByImage: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const projects = await ctx.db.query("projects").collect();
    const lines = [
      "# Project Summary",
      `Generated: ${a.now}`,
      "",
      ...projects.map((p) => `- ${p.name} | status: ${p.status ?? "inactive"} | next: ${p.nextAction ?? "n/a"}`),
    ];
    const note = lines.join("\n");
    const id = await ctx.db.insert("documents", {
      docId: makeDocId(),
      title: a.title ?? "Project Summary",
      fileName: "project-summary.md",
      fileType: "text/markdown",
      dataUrl: `data:text/markdown;base64,${Buffer.from(note).toString("base64")}`,
      note,
      uploadedByType: a.uploadedByType ?? "icarus",
      uploadedByName: a.uploadedByName ?? "Icarus",
      uploadedByEmail: a.uploadedByEmail,
      uploadedByImage: a.uploadedByImage,
      createdAt: a.now,
      updatedAt: a.now,
    });
    await appendActivity(ctx, { eventType: "document_created_summary", entityType: "document", entityId: id, payload: JSON.stringify({ title: "Project Summary" }), createdAt: a.now });
    return id;
  }
});

export const attachToTask = mutation({ args: { taskId: v.id("tasks"), documentId: v.id("documents"), now: v.string() }, handler: async (ctx, a) => { await ctx.db.insert("taskDocuments", { taskId: a.taskId, documentId: a.documentId, createdAt: a.now }); await appendActivity(ctx, { eventType: "document_attached", entityType: "task", entityId: a.taskId, payload: JSON.stringify({ taskId: a.taskId, documentId: a.documentId }), createdAt: a.now }); return true; } });
