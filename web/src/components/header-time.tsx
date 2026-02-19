"use client";
import { useEffect, useState } from "react";

function fmtLocal(d: Date) {
  return d.toLocaleString();
}

function fmtUtc(d: Date) {
  return d.toISOString().replace("T", " ").replace(".000", "");
}

export default function HeaderTime() {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <small>
      Local: {fmtLocal(now)} | UTC: {fmtUtc(now)}
    </small>
  );
}
