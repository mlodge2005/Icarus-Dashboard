import { makeFunctionReference } from "convex/server";

export const api = {
  tasks: {
    list: makeFunctionReference<"query">("tasks:list"),
    create: makeFunctionReference<"mutation">("tasks:create"),
    update: makeFunctionReference<"mutation">("tasks:update"),
    moveStatus: makeFunctionReference<"mutation">("tasks:moveStatus"),
    taskActivity: makeFunctionReference<"query">("tasks:taskActivity"),
  },
  projects: {
    list: makeFunctionReference<"query">("projects:list"),
    create: makeFunctionReference<"mutation">("projects:create"),
  },
  content: {
    list: makeFunctionReference<"query">("content:list"),
    create: makeFunctionReference<"mutation">("content:create"),
    update: makeFunctionReference<"mutation">("content:update"),
  },
  documents: {
    list: makeFunctionReference<"query">("documents:list"),
    create: makeFunctionReference<"mutation">("documents:create"),
    attachToTask: makeFunctionReference<"mutation">("documents:attachToTask"),
  },
  activity: {
    listGlobal: makeFunctionReference<"query">("activity:listGlobal"),
    append: makeFunctionReference<"mutation">("activity:append"),
  },
  capabilities: {
    list: makeFunctionReference<"query">("capabilities:list"),
    upsert: makeFunctionReference<"mutation">("capabilities:upsert"),
    autoProbe: makeFunctionReference<"mutation">("capabilities:autoProbe"),
  },
  protocols: {
    list: makeFunctionReference<"query">("protocols:list"),
    create: makeFunctionReference<"mutation">("protocols:create"),
    createTemplateSet: makeFunctionReference<"mutation">("protocols:createTemplateSet"),
    run: makeFunctionReference<"mutation">("protocols:run"),
    listRuns: makeFunctionReference<"query">("protocols:listRuns"),
    runSteps: makeFunctionReference<"query">("protocols:runSteps"),
    analytics: makeFunctionReference<"query">("protocols:analytics"),
  },
  ops: { snapshot: makeFunctionReference<"query">("ops:snapshot") },
  system: { status: makeFunctionReference<"query">("system:status") },
} as const;
