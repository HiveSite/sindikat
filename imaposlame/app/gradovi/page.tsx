import Link from "next/link";
import { EmptyState, SectionHead } from "@/components/ui";
import { getLookups } from "@/lib/queries/public";

export default async function CitiesPage() {
  const { cities } = await getLookups();
  return (
    <>
      <SectionHead label="Gradovi" title="Poslovi po gradovima" text="Brz pregled oglasa po lokaciji." />
      <div className="grid three">
        {cities.map((city) => <Link className="card link-card" href={`/gradovi/${encodeURIComponent(city.name)}`} key={city.id}><h3>{city.name}</h3><p>Pogledaj aktivne oglase u ovom gradu.</p></Link>)}
        {!cities.length ? <EmptyState title="Nema gradova" text="Dodaj gradove u Supabase tabelu cities." /> : null}
      </div>
    </>
  );
}
