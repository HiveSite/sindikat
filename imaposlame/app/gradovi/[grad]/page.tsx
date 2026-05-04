import { JobCard } from "@/components/job-card";
import { EmptyState, SectionHead } from "@/components/ui";
import { getPublicJobs } from "@/lib/queries/public";

export default async function CityJobsPage({ params }: { params: Promise<{ grad: string }> }) {
  const { grad } = await params;
  const city = decodeURIComponent(grad);
  const jobs = (await getPublicJobs()).filter((job) => job.cities?.name === city);
  return (
    <>
      <SectionHead label="Grad" title={`Poslovi: ${city}`} text="Aktivni oglasi za izabrani grad." />
      <div className="job-list">
        {jobs.map((job) => <JobCard job={job} key={job.id} />)}
        {!jobs.length ? <EmptyState title="Nema oglasa" text="Za ovaj grad trenutno nema aktivnih oglasa." /> : null}
      </div>
    </>
  );
}
