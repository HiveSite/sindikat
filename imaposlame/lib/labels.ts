import type { ApplicationStage, JobStatus, UserRole } from "@/types/domain";

export const roleLabels: Record<UserRole, string> = {
  guest: "Gost",
  candidate: "Kandidat",
  company: "Firma",
  admin: "Upravljanje"
};

export const roleHomes: Record<Exclude<UserRole, "guest">, string> = {
  candidate: "/profil",
  company: "/firma",
  admin: "/admin"
};

export const jobStatusLabels: Record<JobStatus, string> = {
  draft: "Nacrt",
  pending_review: "Čeka pregled",
  active: "Aktivan",
  paused: "Pauziran",
  rejected: "Odbijen",
  expired: "Istekao"
};

export const stageLabels: Record<ApplicationStage, string> = {
  applied: "Nova prijava",
  review: "Pregled",
  interview: "Razgovor",
  shortlist: "Uži izbor",
  offer: "Ponuda",
  hired: "Zaposlen",
  rejected: "Odbijeno"
};

export const stageOrder: ApplicationStage[] = ["applied", "review", "interview", "shortlist", "offer", "hired", "rejected"];
