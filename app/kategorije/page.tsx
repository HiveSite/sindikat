import Link from "next/link";
import { EmptyState, SectionHead } from "@/components/ui";
import { getLookups } from "@/lib/queries/public";

export default async function CategoriesPage() {
  const { categories } = await getLookups();
  return (
    <>
      <SectionHead label="Kategorije" title="Poslovi po kategorijama" text="Oglasi grupisani po oblasti rada." />
      <div className="grid three">
        {categories.map((category) => <Link className="card link-card" href={`/kategorije/${encodeURIComponent(category.name)}`} key={category.id}><h3>{category.name}</h3><p>Pogledaj poslove iz ove kategorije.</p></Link>)}
        {!categories.length ? <EmptyState title="Nema kategorija" text="Dodaj kategorije u Supabase tabelu categories." /> : null}
      </div>
    </>
  );
}
