import Link from "next/link";
import { formatDate, initials, jobUrl } from "@/lib/format";
import { jobStatusLabels } from "@/lib/labels";
import type { Job } from "@/types/domain";
import { Badge, Button } from "./ui";

export function JobCard({ job, admin = false }: { job: Job; admin?: boolean }) {
  return (
    <article className={`job-card ${job.featured ? "featured" : ""}`}>
      <div className="logo">{initials(job.companies?.name)}</div>
      <div>
        <div className="tags">
          {job.featured ? <Badge tone="orange">Istaknuto</Badge> : null}
          <span className="tag">{job.categories?.name || "Ostalo"}</span>
          <span className="tag">{job.contract_type || "Po dogovoru"}</span>
          <Badge tone={job.status === "active" ? "green" : job.status === "pending_review" ? "orange" : "gray"}>
            {jobStatusLabels[job.status]}
          </Badge>
        </div>
        <Link className="job-title" href={jobUrl(job)}>{job.title}</Link>
        <div className="meta">
          <span>{job.companies?.name || "Poslodavac"}</span>
          <span>{job.cities?.name || "Crna Gora"}</span>
          <span>{job.salary_text || "Po dogovoru"}</span>
          <span>Rok {formatDate(job.deadline)}</span>
        </div>
        <p className="job-desc">{job.description}</p>
      </div>
      <div className="job-actions">
        {admin ? (
          <>
            <Button tone="lime" size="sm">Odobri</Button>
            <Button tone="ghost" size="sm">Istakni</Button>
          </>
        ) : (
          <>
            <Button href={jobUrl(job)} tone="ghost" size="sm">Detalji</Button>
            <Button href={jobUrl(job)} tone="blue" size="sm">Prijavi se</Button>
          </>
        )}
      </div>
    </article>
  );
}
