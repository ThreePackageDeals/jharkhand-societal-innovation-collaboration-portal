import { prisma } from '../../config/db';
import { SolutionProposal } from '../../../src/types';
import { problemsService } from '../problems/problems.service';

export class ProposalService {
  async createProposal(data: any) {
    console.log('--- PROPOSAL CREATION START ---');
    console.log('Incoming request payload:', JSON.stringify(data, null, 2));
    try {
      const {
        facultyMentor,
        studentTeam,
        budgetBreakdown,
        milestones,
        ...rest
      } = data;

      if (!data.problemId || !data.heiId) {
        throw new Error('Missing problemId or heiId in request payload.');
      }

      const [problem, university] = await Promise.all([
        prisma.problem.findUnique({ where: { id: data.problemId } }),
        prisma.university.findUnique({ where: { id: data.heiId } }),
      ]);

      if (!problem) {
        throw new Error(`Problem with ID ${data.problemId} not found.`);
      }
      if (!university) {
        throw new Error(`University with ID ${data.heiId} not found.`);
      }

      // STRICT SCHEMA ALIGNMENT
      // Use scalar IDs directly for robustness
      const prismaData: any = {
        problemId: data.problemId,
        heiId: data.heiId,
        problemTitle: data.problemTitle || problem.title,
        heiName: data.heiName || university.name,
        projectTitle: data.projectTitle || 'Untitled Project',
        abstract: data.abstract || 'No abstract provided',
        technologyMethodology: data.technologyLogy || data.technologyMethodology || 'TBD',
        nepExperientialCredits: parseInt(String(data.nepExperientialCredits || 6), 10),
        ipPotential: data.ipPotential || 'PATENTABLE_TECHNOLOGY',
        status: 'open_for_csr',
        mentorName: facultyMentor?.name || 'TBD',
        mentorDepartment: facultyMentor?.department || 'TBD',
        mentorEmail: facultyMentor?.email || 'TBD',
        teamLeadName: studentTeam?.leadName || 'TBD',
        teamLeadEmail: studentTeam?.leadEmail || 'TBD',
        teamMembersCount: parseInt(String(studentTeam?.membersCount || 4), 10),
        teamDepartments: Array.isArray(studentTeam?.departments) ? studentTeam.departments : [],
        budgetHardware: parseFloat(String(budgetBreakdown?.hardwareEquip || 0)),
        budgetPrototyping: parseFloat(String(budgetBreakdown?.prototyping || 0)),
        budgetFieldTesting: parseFloat(String(budgetBreakdown?.fieldTesting || 0)),
        budgetTravel: parseFloat(String(budgetBreakdown?.travelAndLogistics || 0)),
        budgetContingency: parseFloat(String(budgetBreakdown?.contingency || 0)),
        budgetTotal: parseFloat(String(budgetBreakdown?.totalAmount || 0)),
      };

      console.log('Prisma payload being sent:', JSON.stringify(prismaData, null, 2));

      const newProposal = await prisma.solutionProposal.create({
        data: prismaData,
      });

      console.log('Proposal created successfully:', newProposal.id);

      if (milestones && milestones.length > 0) {
        await Promise.all(
          milestones.map((m: any) =>
            prisma.projectMilestone.create({
              data: {
                proposalId: newProposal.id,
                title: m.title || 'Unnamed Milestone',
                stage: m.stage || 'Ideation',
                durationWeeks: parseInt(String(m.durationWeeks || 4), 10),
                status: m.status || 'pending',
                deliverable: m.deliverable || 'TBD',
              },
            })
          )
        );
      }

      try {
        await problemsService.updateStatus(data.problemId, {
          status: 'proposal_submitted',
        });
      } catch (statusError) {
        console.error('Non-critical error updating problem status:', statusError);
      }

      return this.mapProposal(newProposal);
    } catch (error: any) {
      console.error('--- PROPOSAL CREATION ERROR ---');
      console.error('Error message:', error.message);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      if (error.code) {
        console.error('Prisma Error Code:', error.code);
      }
      throw new Error(`Proposal Creation Failed: ${error.message}`);
    } finally {
      console.log('--- PROPOSAL CREATION END ---');
    }
  }

  async getProposalById(id: string) {
    const proposal = await prisma.solutionProposal.findUnique({
      where: { id },
    });
    return proposal ? this.mapProposal(proposal) : null;
  }

  async getProposalsByProblem(problemId: string) {
    const proposals = await prisma.solutionProposal.findMany({
      where: { problemId },
    });
    return proposals.map(p => this.mapProposal(p));
  }

  async updateMilestone(proposalId: string, milestoneId: string, updates: any) {
    const milestone = await prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: updates,
    });

    const proposal = await prisma.solutionProposal.findUnique({
      where: { id: proposalId },
      include: { milestones: true },
    });
    return proposal ? this.mapProposal(proposal) : null;
  }

  async updateStatus(id: string, updates: { status?: string; industryPartnerId?: string; industryPartnerName?: string }) {
    const updated = await prisma.solutionProposal.update({
      where: { id },
      data: updates,
    });
    return this.mapProposal(updated);
  }

  async getAllProposals(filters: { problemId?: string; heiId?: string }) {
    console.log('--- GET ALL PROPOSALS START ---');
    console.log('Filters applied:', JSON.stringify(filters));
    try {
      const where: any = {};
      if (filters.problemId) where.problemId = filters.problemId;
      if (filters.heiId) where.heiId = filters.heiId;

      const proposals = await prisma.solutionProposal.findMany({
        where,
        include: { milestones: true },
      });
      console.log(`Found ${proposals.length} proposals in database`);
      return proposals.map(p => this.mapProposal(p));
    } catch (error: any) {
      console.error('Error in getAllProposals:', error.message);
      throw error;
    } finally {
      console.log('--- GET ALL PROPOSALS END ---');
    }
  }

  private mapProposal(p: any) {
    return {
      ...p,
      facultyMentor: {
        name: p.mentorName,
        department: p.mentorDepartment,
        email: p.mentorEmail,
      },
      studentTeam: {
        leadName: p.teamLeadName,
        leadEmail: p.teamLeadEmail,
        membersCount: p.teamMembersCount,
        departments: this.toStringArray(p.teamDepartments),
      },
      budgetBreakdown: {
        hardwareEquip: p.budgetHardware,
        prototyping: p.budgetPrototyping,
        fieldTesting: p.budgetFieldTesting,
        travelAndLogistics: p.budgetTravel,
        contingency: p.budgetContingency,
        totalAmount: p.budgetTotal,
      },
      milestones: p.milestones || [],
    };
  }

  /**
   * `teamDepartments` is stored as JSON. Older seeded records used a JSON
   * string, so normalize both representations before sending data to clients.
   */
  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === 'string')
          : [];
      } catch {
        return [];
      }
    }

    return [];
  }
}

export const proposalService = new ProposalService();
