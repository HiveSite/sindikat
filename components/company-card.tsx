import Link from "next/link";
import { companyUrl, initials } from "@/lib/format";
import type { Company } from "@/types/domain";
import { Badge } from "./ui";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <article className="company-card">
      <div className="logo">{initials(company.name)}</div>
      <div>
        <h3><Link href={companyUrl(company)}>{company.name}</Link></h3>
        <p>{company.description || "Profil poslodavca."}</p>
        <div className="meta">
          <span>{company.city || "Crna Gora"}</span>
          <span>{company.industry || "Poslodavac"}</span>
          {company.approved ? <Badge tone="green">Odobrena</Badge> : <Badge tone="orange">Čeka odobrenje</Badge>}
        </div>
      </div>
    </article>
  );
}
