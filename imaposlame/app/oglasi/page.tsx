import type { Metadata } from "next";
import { JobCard } from "@/components/job-card";
import { EmptyState, SectionHead } from "@/components/ui";
import { getLookups, getPublicJobs } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Oglasi za posao",
  description: "Pretraži oglase za posao u Crnoj Gori. Filtriraj po gradu i kategoriji."
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ q?: string; city?: string; category?: string }> }) {
  const params = await searchParams;
  const [jobs, lookups] = await Promise.all([getPublicJobs(), getLookups()]);
  const q = (params.q || "").toLowerCase();
  const list = jobs.filter((job) => {
    const haystack = `${job.title} ${job.description} ${job.companies?.name || ""} ${job.categories?.name || ""}`.toLowerCase();
    return (!q || haystack.includes(q)) && (!params.city || job.cities?.name === params.city) && (!params.category || job.categories?.name === params.category);
  });

  return (
    <>
      <SectionHead label="Oglasi" title="Oglasi za posao" text="Filtriraj oglase po poziciji, gradu i kategoriji." />
      <form className="search-panel">
        <input name="q" placeholder="Pozicija, firma ili vještina" defaultValue={params.q || ""} />
        <select name="city" defaultValue={params.city || ""}>
          <option value="">Svi gradovi</option>
          {lookups.cities.map((city) => <option key={city.id}>{city.name}</option>)}
        </select>
        <select name="category" defaultValue={params.category || ""}>
          <option value="">Sve kategorije</option>
          {lookups.categories.map((category) => <option key={category.id}>{category.name}</option>)}
        </select>
        <button>Traži</button>
      </form>
      <div className="job-list">
        {list.map((job) => <JobCard job={job} key={job.id} />)}
        {!list.length ? <EmptyState title="Nema oglasa" text="Promijeni filtere ili se vrati kasnije." /> : null}
      </div>
    </>
  );
}
