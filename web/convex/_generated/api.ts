export const api = {
  tasks: { list: "tasks:list", create: "tasks:create", update: "tasks:update", moveStatus: "tasks:moveStatus", taskActivity: "tasks:taskActivity" },
  projects: { list: "projects:list", create: "projects:create" },
  content: { list: "content:list", create: "content:create", update: "content:update" },
  documents: { list: "documents:list", create: "documents:create", attachToTask: "documents:attachToTask" },
  activity: { listGlobal: "activity:listGlobal", append: "activity:append" }
} as const;
