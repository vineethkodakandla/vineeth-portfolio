import bitwise from "./bitwise";
import evalObservatory from "./eval-observatory";
import meteorLake from "./meteor-lake";
import type { CaseStudy } from "./types";

// Same order as the featured cards on the home page.
export const CASE_STUDIES: CaseStudy[] = [bitwise, meteorLake, evalObservatory];

export type { CaseStudy };
