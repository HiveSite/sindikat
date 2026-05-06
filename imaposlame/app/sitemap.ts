import type { MetadataRoute } from "next";
import { getCompanies, getLookups, getPublicJobs } from "@/lib/queries/public";
import { companyUrl, jobUrl } from "@/lib/format";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://imaposla.me";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/oglasi`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/firme`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/gradovi`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/kategorije`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/za-firme`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/registracija`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privatnost`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/uslovi-koriscenja`, changeFrequency: "yearly", priority: 0.2 }
  ];

  const [jobs, companies, lookups] = await Promise.all([
    getPublicJobs(),
    getCompanies(),
    getLookups()
  ]);

  const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${base}${jobUrl(job)}`,
    changeFrequency: "weekly",
    priority: 0.8
  }));

  const companyRoutes: MetadataRoute.Sitemap = companies.map((company) => ({
    url: `${base}${companyUrl(company)}`,
    changeFrequency: "weekly",
    priority: 0.6
  }));

  const cityRoutes: MetadataRoute.Sitemap = lookups.cities.map((city) => ({
    url: `${base}/gradovi/${city.slug}`,
    changeFrequency: "daily",
    priority: 0.7
  }));

  const categoryRoutes: MetadataRoute.Sitemap = lookups.categories.map((cat) => ({
    url: `${base}/kategorije/${cat.slug}`,
    changeFrequency: "daily",
    priority: 0.7
  }));

  return [...staticRoutes, ...jobRoutes, ...companyRoutes, ...cityRoutes, ...categoryRoutes];
}
