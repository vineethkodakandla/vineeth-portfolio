import type { ComponentType } from "react";
import type { LinkRef } from "@/content/projects";

export type CaseStudy = {
  slug: string;
  title: string;
  kicker: string;
  /** One or two sentences under the title. */
  deck: string;
  /** Meta description for search and link previews. */
  description: string;
  meta: string[];
  links: LinkRef[];
  Body: ComponentType;
};
