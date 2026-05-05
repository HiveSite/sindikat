import { JobCard } from "@/components/job-card";
import { EmptyState, SectionHead } from "@/components/ui";
import { getPublicJobsByCategory } from "@/lib/queries/public";

export default async function CategoryJobsPage({ params }: { params: Promise<{ kategorija: string }> }) {
  const { kategorija } = await params;
  const category = decodeURIComponent(kategorija);
  const jobs = await getPublicJobsByCategory(category);
  return (
    <>
      <SectionHead label="Kategorija" title={`Poslovi: ${category}`} text="Aktivni oglasi iz izabrane kategorije." />
      <div className="job-list">
        {jobs.map((job) => <JobCard job={job} key={job.id} />)}
        {!jobs.length ? <EmptyState title="Nema oglasa" text="Za ovu kategoriju trenutno nema aktivnih oglasa." /> : null}
      </div>
    </>
  );
}
