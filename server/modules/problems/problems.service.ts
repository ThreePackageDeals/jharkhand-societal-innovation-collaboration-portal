import { prisma } from '../../config/db';
import { ProblemStatement } from '../../../src/types';
import { emailService } from '../../utils/email';
import { logger } from '../../utils/logger';

export class ProblemsService {
  async getAllProblems(filters: {
    district?: string;
    domain?: string;
    status?: string;
    query?: string;
    heiId?: string;
  }) {
    const { district, domain, status, query, heiId } = filters;

    const where: any = {};
    if (district && district !== 'all') where.district = district;
    if (domain && domain !== 'all') where.domain = domain;
    if (status && status !== 'all') where.status = status;
    if (heiId && heiId !== 'all') where.assignedHeiId = heiId;

    if (query) {
      const q = String(query).toLowerCase();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { blockOrPanchayat: { contains: q } },
        { trackingCode: { contains: q } },
      ];
    }

    return await prisma.problem.findMany({
      where,
      include: {
        aiAnalysis: true,
        mediaAttachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProblemById(idOrCode: string) {
    return await prisma.problem.findFirst({
      where: {
        OR: [
          { id: idOrCode },
          { trackingCode: idOrCode },
        ],
      },
      include: {
        aiAnalysis: true,
        mediaAttachments: true,
      },
    });
  }

  async upvoteProblem(id: string) {
    return await prisma.problem.update({
      where: { id },
      data: {
        upvotesCount: { increment: 1 },
      },
    });
  }

  async createProblem(data: any & { embedding?: number[] }) {
    const year = new Date().getFullYear();
    const count = await prisma.problem.count() + 1;
    const districtCode = (data.district || 'JHK').slice(0, 3).toUpperCase();
    const trackingCode = `JH-${districtCode}-${year}-${String(count).padStart(3, '0')}`;
    const id = `prob-${year}-${String(count).padStart(3, '0')}`;

    const location = data.locationCoords || {
      lat: 23.3441,
      lng: 85.3096,
      address: `${data.district}, Jharkhand`
    };
    const submitter = data.submittedBy || {
      name: 'Concerned Citizen',
      type: 'citizen',
      contact: '+91 94311 00000',
      email: 'citizen@jharkhand.gov.in',
    };
    const mediaUrls = data.mediaUrls && data.mediaUrls.length > 0
      ? data.mediaUrls
      : ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f7?auto=format&fit=crop&w=800&q=80'];

    const aiAnalysis = data.aiAnalysis || {
      category: data.domain,
      subCategory: 'Citizen Societal Need',
      priorityScore: 85,
      urgencyLevel: data.urgency || 'High',
      thematicTags: [data.domain, data.district, 'Grassroots Challenge'],
      recommendedTech: ['Low cost field prototype', 'Local community co-management'],
      nepRelevance: 'Multidisciplinary Student Project (NEP 2020)',
      estimatedBudgetBand: '₹2.0 Lakhs - ₹4.0 Lakhs',
      socialImpactPotential: 'Measurable improvement in community wellbeing',
    };

    return await prisma.problem.create({
      data: {
        id,
        trackingCode,
        title: data.title,
        description: data.description,
        embedding: data.embedding || [],
        domain: data.domain,
        district: data.district,
        blockOrPanchayat: data.blockOrPanchayat || 'District Headquarter Zone',
        locationLat: location.lat,
        locationLng: location.lng,
        locationAddress: location.address,
        submitterName: submitter.name,
        submitterType: submitter.type,
        submitterContact: submitter.contact,
        submitterEmail: submitter.email,
        submitterOrg: submitter.organization,
        urgency: data.urgency || 'High',
        affectedPopulation: Number(data.affectedPopulation) || 1500,
        status: 'submitted',
        socialImpactMetric: 'Awaiting institutional allocation and multidisciplinary team assignment',
        viewsCount: 1,
        upvotesCount: 1,
        mediaAttachments: {
          create: mediaUrls.map(url => ({
            url,
            type: 'image',
          })),
        },
        aiAnalysis: {
          create: {
            category: aiAnalysis.category,
            subCategory: aiAnalysis.subCategory,
            priorityScore: aiAnalysis.priorityScore,
            urgencyLevel: aiAnalysis.urgencyLevel,
            thematicTags: aiAnalysis.thematicTags,
            recommendedTech: aiAnalysis.recommendedTech,
            nepRelevance: aiAnalysis.nepRelevance,
            estimatedBudgetBand: aiAnalysis.estimatedBudgetBand,
            socialImpactPotential: aiAnalysis.socialImpactPotential,
          },
        },
      },
      include: {
        aiAnalysis: true,
        mediaAttachments: true,
      },
    });
  }

  async assignToHei(id: string, heiId: string, department: string) {
    const problem = await this.getProblemById(id);
    const university = await prisma.university.findUnique({ where: { id: heiId } });

    if (!problem || !university) throw new Error('Problem or University not found');

    const updated = await prisma.problem.update({
      where: { id },
      data: {
        assignedHeiId: heiId,
        assignedDepartment: department,
        status: 'assigned_to_hei',
      },
    });

    // Trigger Email Notification
    const universityEmail = (university as any).email || 'admin@university.edu';

    emailService.sendEmail(
      universityEmail,
      `New Societal Challenge Assigned: ${problem.title}`,
      `Dear ${university.name} Administration,\n\nA new societal challenge from ${problem.district} has been assigned to your institution's ${department} department.\n\nTracking Code: ${problem.trackingCode}\nChallenge: ${problem.title}\n\nPlease review and assign a multidisciplinary faculty-student team.\n\nRegards,\nJharkhand State Registry`
    ).catch(err => logger.error('Failed to send assignment email:', err));

    return updated;
  }

  async updateStatus(id: string, updates: {
    status?: string;
    partnerIndustryId?: string;
    fundingAmount?: number;
    socialImpactMetric?: string;
  }) {
    return await prisma.problem.update({
      where: { id },
      data: updates,
    });
  }
}

export const problemsService = new ProblemsService();
