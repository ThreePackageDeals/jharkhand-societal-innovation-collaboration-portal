import { OrgType, PrismaClient } from '@prisma/client';
import {
  INITIAL_UNIVERSITIES,
  INITIAL_ORGANIZATIONS,
  INITIAL_PROBLEM_STATEMENTS,
  INITIAL_SOLUTION_PROPOSALS,
  INITIAL_DISCUSSIONS
} from '../src/data/jharkhandData';

const prisma = new PrismaClient();

const organizationTypeMap: Record<string, OrgType> = {
  Industry: OrgType.CORPORATE,
  'Research Lab': OrgType.RESEARCH_LAB,
  'CSR Foundation': OrgType.CSR,
  Startup: OrgType.STARTUP,
};

async function main() {
  console.log('🌱 Starting seeding process...');

  // 0. Seed SUPER_ADMIN
  console.log('🔑 Seeding Super Admin...');
  await prisma.user.upsert({
    where: { email: 'admin@jharkhand.gov.in' },
    update: {},
    create: {
      id: 'super-admin-id', // In real app, this comes from Supabase Auth
      email: 'admin@jharkhand.gov.in',
      fullName: 'System Super Administrator',
      role: 'SUPER_ADMIN',
      verificationStatus: 'NOT_REQUIRED',
      isActive: true,
    },
  });

  // 1. Universities
  console.log('🎓 Seeding Universities...');
  for (const uni of INITIAL_UNIVERSITIES) {
    await prisma.university.upsert({
      where: { id: uni.id },
      update: {},
      create: {
        id: uni.id,
        name: uni.name,
        shortName: uni.shortName,
        district: uni.district,
        type: uni.type,
        establishedYear: uni.establishedYear,
        specializationDomains: uni.specializationDomains,
        departments: uni.departments,
        incubationCenter: uni.incubationCenter,
        website: uni.website,
        activeProjectsCount: uni.activeProjectsCount,
        studentResearchersCount: uni.studentResearchersCount,
        rating: uni.rating,
        logoUrl: uni.logoUrl,
        domains: uni.domains,
      },
    });
  }

  // 2. Organizations (formerly Industry Partners)
  console.log('🏭 Seeding Organizations...');
  for (const org of INITIAL_ORGANIZATIONS) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: {},
      create: {
        id: org.id,
        name: org.name,
        type: organizationTypeMap[org.type],
        focusDomains: org.focusDomains,
        headquarters: org.headquarters,
        csrBudgetCommitted: org.csrBudgetCommitted,
        availableMentors: org.availableMentors,
        activeCollaborations: org.activeCollaborations,
        description: org.description,
        pilotTestSites: org.pilotTestSites,
        contactPerson: org.contactPerson,
        isVerified: true, // Seeded data is verified
      },
    });
  }

  // 3. Problems
  console.log('📝 Seeding Problems...');
  for (const prob of INITIAL_PROBLEM_STATEMENTS) {
    await prisma.problem.upsert({
      where: { id: prob.id },
      update: {},
      create: {
        id: prob.id,
        trackingCode: prob.trackingCode,
        title: prob.title,
        description: prob.description,
        domain: prob.domain,
        district: prob.district,
        blockOrPanchayat: prob.blockOrPanchayat,
        locationLat: prob.locationCoords?.lat,
        locationLng: prob.locationCoords?.lng,
        locationAddress: prob.locationCoords?.address,
        urgency: prob.urgency,
        affectedPopulation: prob.affectedPopulation,
        status: prob.status,
        socialImpactMetric: prob.socialImpactMetric,
        viewsCount: prob.viewsCount,
        upvotesCount: prob.upvotesCount,
        createdAt: new Date(prob.createdAt),
        updatedAt: new Date(prob.updatedAt),
        submitterName: prob.submittedBy?.name,
        submitterType: prob.submittedBy?.type,
        submitterContact: prob.submittedBy?.contact,
        submitterEmail: prob.submittedBy?.email,
        submitterOrg: prob.submittedBy?.organization,
        assignedHeiId: prob.assignedHeiId,
        assignedHeiName: prob.assignedHeiName,
        assignedDepartment: prob.assignedDepartment,
        partnerOrgId: prob.partnerOrgId,
        partnerOrgName: prob.partnerOrgName,
        fundingAmount: prob.fundingAmount,
        aiAnalysis: {
          create: {
            category: prob.aiAnalysis?.category,
            subCategory: prob.aiAnalysis?.subCategory,
            priorityScore: prob.aiAnalysis?.priorityScore,
            urgencyLevel: prob.aiAnalysis?.urgencyLevel,
            thematicTags: JSON.stringify(prob.aiAnalysis?.thematicTags),
            recommendedTech: JSON.stringify(prob.aiAnalysis?.recommendedTech),
            nepRelevance: prob.aiAnalysis?.nepRelevance,
            estimatedBudgetBand: prob.aiAnalysis?.estimatedBudgetBand,
            socialImpactPotential: prob.aiAnalysis?.socialImpactPotential,
            matchedHeis: {
              create: prob.aiAnalysis?.matchedHeis.map(mh => ({
                universityId: mh.universityId,
                universityName: mh.universityName,
                department: mh.department,
                matchScore: mh.matchScore,
                reason: mh.reason,
              })),
            },
            duplicateMatches: {
              create: prob.aiAnalysis?.duplicateMatches.map(dm => ({
                problemId: dm.problemId,
                title: dm.title,
                similarity: dm.similarity,
                district: dm.district,
              })),
            },
          },
        },
        mediaAttachments: {
          create: prob.mediaUrls.map(url => ({
            url,
            type: 'image',
          })),
        },
      },
    });
  }

  // 4. Solution Proposals
  console.log('💡 Seeding Solution Proposals...');
  for (const prop of INITIAL_SOLUTION_PROPOSALS) {
    await prisma.solutionProposal.upsert({
      where: { id: prop.id },
      update: {},
      create: {
        id: prop.id,
        problemId: prop.problemId,
        problemTitle: prop.problemTitle,
        heiId: prop.heiId,
        heiName: prop.heiName,
        projectTitle: prop.projectTitle,
        abstract: prop.abstract,
        technologyMethodology: prop.technologyMethodology,
        nepExperientialCredits: prop.nepExperientialCredits,
        ipPotential: prop.ipPotential,
        status: prop.status,
        mentorName: prop.facultyMentor?.name,
        mentorDepartment: prop.facultyMentor?.department,
        mentorEmail: prop.facultyMentor?.email,
        teamLeadName: prop.studentTeam?.leadName,
        teamLeadEmail: prop.studentTeam?.leadEmail,
        teamMembersCount: prop.studentTeam?.membersCount,
        teamDepartments: prop.studentTeam?.departments ?? [],
        budgetHardware: prop.budgetBreakdown?.hardwareEquip,
        budgetPrototyping: prop.budgetBreakdown?.prototyping,
        budgetFieldTesting: prop.budgetBreakdown?.fieldTesting,
        budgetTravel: prop.budgetBreakdown?.travelAndLogistics,
        budgetContingency: prop.budgetBreakdown?.contingency,
        budgetTotal: prop.budgetBreakdown?.totalAmount,
        partnerOrgId: prop.partnerOrgId,
        partnerOrgName: prop.partnerOrgName,
        milestones: {
          create: prop.milestones.map(m => ({
            id: m.id,
            title: m.title,
            stage: m.stage,
            durationWeeks: m.durationWeeks,
            status: m.status,
            deliverable: m.deliverable,
            verificationEvidence: m.verificationEvidence,
            completedDate: m.completedDate ? new Date(m.completedDate) : null,
          })),
        },
      },
    });
  }

  // 5. Discussions
  console.log('💬 Seeding Discussions...');
  for (const problemId in INITIAL_DISCUSSIONS) {
    for (const msg of INITIAL_DISCUSSIONS[problemId]) {
      await prisma.discussion.upsert({
        where: { id: msg.id },
        update: {},
        create: {
          id: msg.id,
          problemId: problemId,
          senderName: msg.senderName,
          senderRole: msg.senderRole,
          message: msg.message,
          timestamp: new Date(msg.timestamp),
        },
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
