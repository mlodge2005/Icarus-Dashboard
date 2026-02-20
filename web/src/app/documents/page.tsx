"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { api } from "../../../convex/_generated/api";

export default function Documents() {
  const docs = (useQuery(api.documents.list as any, {}) as any[] | undefined) ?? [];
  const upload = useMutation(api.documents.upload as any);
  const remove = useMutation(api.documents.remove as any);
  const { data: session } = useSession();

  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("Uploaded Document");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const filtered = useMemo(() => docs.filter((d) =>
    (d.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.docId || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.note || "").toLowerCase().includes(search.toLowerCase())
  ), [docs, search]);

  const uploader = {
    uploadedByType: "user",
    uploadedByName: session?.user?.name ?? "Unknown User",
    uploadedByEmail: session?.user?.email ?? undefined,
    uploadedByImage: session?.user?.image ?? undefined,
  } as const;

  const doUpload = async () => {
    if (!file) {
      setMsg("Select a file first.");
      return;
    }
    const extOk = /\.(txt|md|png)$/i.test(file.name);
    if (!extOk) {
      setMsg("Upload blocked: only .txt, .md, .png are allowed.");
      return;
    }
    const maxBytes = 500 * 1024;
    if (file.size > maxBytes) {
      setMsg(`Upload blocked: file too large (${Math.round(file.size/1024)}KB). Max 500KB.`);
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("Failed to read file"));
      r.readAsDataURL(file);
    });

    try {
      await upload({
        title: title || file.name,
        fileName: file.name,
        fileType: (file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : file.name.toLowerCase().endsWith(".md") ? "text/markdown" : "text/plain")) as any,
        dataUrl,
        note: note || undefined,
        now: new Date().toISOString(),
        ...uploader,
      });
      setMsg(`Document uploaded to library: ${file.name}`);
      setNote("");
      setFile(null);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="wrap">
      <h1>Documents Hub</h1>
      <p><small>Library mode: upload, search, download, reference by Doc ID, and remove documents.</small></p>
      {msg ? <small>{msg}</small> : null}

      <div className="card">
        <strong>Upload Document</strong>
        <p><small>Allowed types: .txt, .md, .png</small></p>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Document title" style={{width:"100%"}} />
        <textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Optional note" style={{width:"100%",marginTop:8}} />
        <input type="file" accept=".txt,.md,.png,text/plain,text/markdown,image/png" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
        <div style={{marginTop:8}}>
          <button onClick={()=>void doUpload()}>Upload</button>
        </div>
      </div>

      <div className="card">
        <strong>Search</strong>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search by title, Doc ID, or notes" />
      </div>

      {filtered.map((d) => (
        <div className="card" key={d._id}>
          <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
            <div>
              <strong>{d.title}</strong>
              <div><small>Doc ID:</small> <code>{d.docId ?? "n/a"}</code></div>
            </div>
            <div style={{textAlign:"right"}}>
              <small>{d.createdAt}</small>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
            {d.uploadedByImage ? <img src={d.uploadedByImage} alt="uploader" style={{width:24,height:24,borderRadius:999}} /> : null}
            <small>Uploaded by: {d.uploadedByName ?? "Unknown"} {d.uploadedByEmail ? `(${d.uploadedByEmail})` : ""}</small>
          </div>

          <div><small>Type:</small> {d.fileType ?? (d.url ? "link" : "note")}</div>
          <div><small>Note:</small> {d.note ?? ""}</div>

          <div style={{display:"flex",gap:8,marginTop:8}}>
            {d.dataUrl ? <a href={d.dataUrl} download={d.fileName ?? `${d.docId || d._id}`}>Download</a> : null}
            {d.url ? <a href={d.url} target="_blank">Open Link</a> : null}
            <button onClick={async()=>{try{await remove({id:d._id}); setMsg("Document removed.");}catch(e){setMsg((e as Error).message)}}}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
