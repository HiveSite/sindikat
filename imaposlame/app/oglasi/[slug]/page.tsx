import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/apply-form";
import { Badge, Button } from "@/components/ui";
import { formatDate, parseIdFromSlug } from "@/lib/format";
import { getJobById } from "@/lib/queries/public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = parseIdFromSlug(slug);
  if (!id) return { title: "Oglas nije pronađen" };
  const job = await getJobById(id);
  if (!job) return { title: "Oglas nije pronađen" };
  return {
    title: `${job.title}${job.companies?.name ? ` — ${job.companies.name}` : ""}`,
    description: job.description?.slice(0, 160)
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const id = parseIdFromSlug(slug);
  if (!id) return notFound();
  const job = await getJobById(id);
  if (!job) return notFound();

  return (
    <>
      <Button href="/oglasi" size="sm">Nazad na oglase</Button>
      <section className="detail-layout with-top-space">
        <div className="panel">
          <span className="eyebrow">{job.categories?.name || "Oglas"}</span>
          <h1>{job.title}</h1>
          <p className="lead">{job.description}</p>
          <div className="tags">
            <Badge tone="blue">{job.companies?.name || "Poslodavac"}</Badge>
            <Badge tone="lime">{job.cities?.name || "Crna Gora"}</Badge>
            <Badge>{job.salary_text || "Po dogovoru"}</Badge>
            <Badge>{job.contract_type || "Po dogovoru"}</Badge>
            <Badge tone="green">Rok {formatDate(job.deadline)}</Badge>
          </div>
        </div>
        <aside className="form-card sticky">
          <h2>Prijava</h2>
          <ApplyForm jobId={job.id} />
        </aside>
      </section>
    </>
  );
}
