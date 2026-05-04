import { notFound } from "next/navigation";
import { JobCard } from "@/components/job-card";
import { Badge, Button, EmptyState, SectionHead } from "@/components/ui";
import { parseIdFromSlug } from "@/lib/format";
import { getCompanyById, getPublicJobs } from "@/lib/queries/public";

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = parseIdFromSlug(slug);
  if (!id) return notFound();
  const [company, jobs] = await Promise.all([getCompanyById(id), getPublicJobs()]);
  if (!company) return notFound();
  const companyJobs = jobs.filter((job) => job.company_id === company.id);

  return (
    <>
      <Button href="/firme" size="sm">Nazad na firme</Button>
      <div className="panel with-top-space">
        <span className="eyebrow">Profil firme</span>
        <h1>{company.name}</h1>
        <p className="lead">{company.description || "Profil poslodavca."}</p>
        <div className="tags">
          <Badge tone="lime">{company.city || "Crna Gora"}</Badge>
          <Badge>{company.industry || "Poslodavac"}</Badge>
        </div>
      </div>
      <SectionHead title="Aktivni oglasi" text="Svi javni oglasi ovog poslodavca." />
      <div className="job-list">
        {companyJobs.map((job) => <JobCard job={job} key={job.id} />)}
        {!companyJobs.length ? <EmptyState title="Nema aktivnih oglasa" text="Ova firma trenutno nema javno aktivnih oglasa." /> : null}
      </div>
    </>
  );
}
