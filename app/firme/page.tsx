import { CompanyCard } from "@/components/company-card";
import { EmptyState, SectionHead } from "@/components/ui";
import { getCompanies } from "@/lib/queries/public";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <>
      <SectionHead label="Firme" title="Odobreni poslodavci" text="Javni profili firmi koje su prošle provjeru." />
      <div className="grid two">
        {companies.map((company) => <CompanyCard company={company} key={company.id} />)}
        {!companies.length ? <EmptyState title="Nema firmi" text="Firme se prikazuju nakon odobrenja." /> : null}
      </div>
    </>
  );
}
