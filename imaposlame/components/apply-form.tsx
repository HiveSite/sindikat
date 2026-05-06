"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { normalizeRole } from "@/lib/auth-role";

type ApplyState = "loading" | "guest" | "wrong-role" | "duplicate" | "no-cv" | "ready" | "submitting" | "done" | "error";

export function ApplyForm({ jobId }: { jobId: number }) {
  const [state, setState] = useState<ApplyState>("loading");
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [supabase] = useState(() => createBrowserSupabase());

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) { setState("guest"); return; }

      const user = data.user;
      setUserId(user.id);

      const { data: profileData } = await supabase.from("profiles").select("role,full_name,phone,city,cv_data").eq("id", user.id).maybeSingle();
      const role = normalizeRole(profileData?.role);

      if (role !== "candidate") { setState("wrong-role"); return; }

      const { data: existing } = await supabase.from("job_applications").select("id").eq("job_id", jobId).eq("candidate_id", user.id).maybeSingle();
      if (existing?.id) { setState("duplicate"); return; }

      const cv = profileData?.cv_data || {};
      const hasCv = Boolean(
        (cv as any).summary || (cv as any).experience || (cv as any).skills ||
        profileData?.full_name || profileData?.phone || profileData?.city
      );
      if (!hasCv) { setState("no-cv"); return; }

      setState("ready");
    }
    load();
  }, [jobId, supabase]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    setState("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const row = {
      job_id: jobId,
      candidate_id: userId,
      cover_letter: String(formData.get("cover_letter") || ""),
      cv_path: null,
      reference_code: `IP-${Date.now()}`
    };

    const { error } = await supabase.from("job_applications").insert(row);
    if (error) {
      console.error("[ApplyForm:submit]", error.message);
      setMessage(error.message);
      setState("error");
      return;
    }
    setState("done");
    window.location.href = "/profil/prijave";
  }

  if (state === "loading") return <p className="notice">Provjeravamo nalog...</p>;

  if (state === "guest") return (
    <div className="empty">
      <strong>Prijava zahtijeva nalog</strong>
      <p>Prijavi se kao kandidat i dopuni biografiju.</p>
      <Link className="btn blue" href="/login">Prijava</Link>
    </div>
  );

  if (state === "wrong-role") return (
    <div className="empty">
      <strong>Samo kandidat može poslati prijavu</strong>
      <p>Ako koristiš nalog firme, ovaj oglas možeš samo pregledati.</p>
    </div>
  );

  if (state === "duplicate") return (
    <p className="notice">Za ovaj oglas već postoji tvoja prijava. Status prati u <Link href="/profil/prijave">Moje prijave</Link>.</p>
  );

  if (state === "no-cv") return (
    <div className="empty">
      <strong>Biografija nije popunjena</strong>
      <p>Dopuni biografiju u profilu, pa pošalji prijavu.</p>
      <Link className="btn blue" href="/profil/biografija">Dopuni biografiju</Link>
    </div>
  );

  if (state === "done") return <p className="notice">Prijava je poslata. Preusmjeravamo na tvoje prijave...</p>;

  return (
    <form onSubmit={submit} className="apply-form">
      <label>
        <span className="label">Poruka firmi</span>
        <textarea
          className="textarea"
          name="cover_letter"
          maxLength={1200}
          placeholder="Kratko predstavljanje, iskustvo i dostupnost"
        />
      </label>
      <p className="notice">Prijava koristi biografiju iz profila. Fajlovi se ne šalju i ne čuvaju.</p>
      <button className="btn blue" disabled={state === "submitting"}>
        {state === "submitting" ? "Slanje..." : "Pošalji prijavu"}
      </button>
      {message ? <p className="notice error">{message}</p> : null}
    </form>
  );
}
