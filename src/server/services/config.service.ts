import { prisma } from "@/lib/db";
import type { EsgConfiguration, Organization } from "@prisma/client";

/** Fetch the (single) organisation, or null. */
export async function getPrimaryOrganization(): Promise<Organization | null> {
  return prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
}

/**
 * Return the ESG configuration for an organisation, creating a default row on
 * first access so the rest of the app can rely on it existing.
 */
export async function getEsgConfig(organizationId: string): Promise<EsgConfiguration> {
  const existing = await prisma.esgConfiguration.findUnique({
    where: { organizationId },
  });
  if (existing) return existing;
  return prisma.esgConfiguration.create({
    data: { organizationId },
  });
}

export interface Weights {
  environmental: number;
  social: number;
  governance: number;
}

export async function getWeights(organizationId: string): Promise<Weights> {
  const config = await getEsgConfig(organizationId);
  return {
    environmental: config.environmentalWeight,
    social: config.socialWeight,
    governance: config.governanceWeight,
  };
}
