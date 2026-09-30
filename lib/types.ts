export type SchemeStatus =
  | "draft"
  | "published";

export type Scheme = {
  id: string;

  name: string;
  slug: string;
  category: string;

  status: SchemeStatus;

  short_description: string;
  description: string;

  benefits: string[];
  documents: string[];
  occupations: string[];
  exclusions: string[];

  min_age: number | null;
  max_age: number | null;
  max_income: number | null;

  eligibility_summary: string;

  last_verified: string;
  official_url: string;

  created_at: string;
  updated_at: string;
};