import { prisma } from '../../config/db';
import { IndustryPartner } from '../../../src/types';
import { problemsService } from '../problems/problems.service';
import { proposalService } from '../proposals/proposals.service';

// JSONB columns may hold either a JSON array or a JSON-encoded string (legacy
// rows written with JSON.stringify). Normalize so the API always returns arrays.
const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
};

export class IndustryService {
  async getAllPartners() {
    const partners = await prisma.organization.findMany({
      where: {
        type: { in: ['CORPORATE', 'CSR', 'MSME', 'STARTUP'] }
      }
    });
    return partners.map(p => ({
      ...p,
      focusDomains: toArray(p.focusDomains),
      pilotTestSites: toArray(p.pilotTestSites),
    }));
  }

  async getPartnerById(id: string) {
    const partner = await prisma.organization.findUnique({
      where: { id },
    });
    if (!partner) return null;
    return {
      ...partner,
      focusDomains: toArray(partner.focusDomains),
      pilotTestSites: toArray(partner.pilotTestSites),
    };
  }

  async createPartner(data: any) {
    const { focusDomains, pilotTestSites, ...rest } = data;
    const newPartner = await prisma.organization.create({
      data: {
        ...rest,
        type: data.type || 'CORPORATE',
        focusDomains: focusDomains || [],
        pilotTestSites: pilotTestSites || [],
      },
    });
    return {
      ...newPartner,
      focusDomains: toArray(newPartner.focusDomains),
      pilotTestSites: toArray(newPartner.pilotTestSites),
    };
  }

  async updatePartner(id: string, data: any) {
    const { focusDomains, pilotTestSites, ...rest } = data;
    const updateData: any = { ...rest };
    if (focusDomains) updateData.focusDomains = focusDomains;
    if (pilotTestSites) updateData.pilotTestSites = pilotTestSites;

    const updatedPartner = await prisma.organization.update({
      where: { id },
      data: updateData,
    });
    return {
      ...updatedPartner,
      focusDomains: toArray(updatedPartner.focusDomains),
      pilotTestSites: toArray(updatedPartner.pilotTestSites),
    };
  }

  async deletePartner(id: string) {
    return await prisma.organization.delete({
      where: { id },
    });
  }

  async pledgeFunding(data: {
    problemId?: string;
    proposalId: string;
    industryId?: string;
    partnerId?: string;
    pledgeAmount?: number;
    amount?: number;
    mentorshipOffer?: string;
    mentorName?: string;
    pilotSiteOffer?: string;
    pilotSite?: string;
  }) {
    const industryId = data.industryId || data.partnerId;
    const pledgeAmount = data.pledgeAmount || data.amount || 0;

    if (!industryId) throw new Error('Industry partner ID is required');

    const partner = await this.getPartnerById(industryId);
    if (!partner) throw new Error('Industry partner not found');

    // Update Problem if problemId is provided
    if (data.problemId) {
      await problemsService.updateStatus(data.problemId, {
        partnerIndustryId: partner.id,
        fundingAmount: pledgeAmount,
        status: 'industry_partnered',
      });
    }

    // Update Proposal
    await proposalService.updateStatus(data.proposalId, {
      industryPartnerId: partner.id,
      industryPartnerName: partner.name,
      status: 'industry_partnered',
    });

    return { success: true, message: 'Funding pledge recorded' };
  }
}

export const industryService = new IndustryService();
