import { prisma } from '../../config/db';
import { ProblemStatement } from '../../../src/types';
import { emailService } from '../../utils/email';
import { logger } from '../../utils/logger';
import { aiService } from '../ai/ai.service';

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

    const problems = await prisma.problem.findMany({
      where,
      include: {
        aiAnalysis: true,
        mediaAttachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return problems.map((problem) => this.mapProblem(problem));
  }

  async getProblemById(idOrCode: string) {
    const problem = await prisma.problem.findFirst({
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
    return problem ? this.mapProblem(problem) : null;
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
    // 1. Mandatory image validation
    const rawMedia = (data.mediaUrls || []).filter((u: any) => typeof u === 'string' && u.trim().length > 0);
    if (rawMedia.length === 0) {
      throw new Error('Image evidence is compulsory. Please upload or provide at least one photo of the problem.');
    }

    // 2. Gemini Multimodal Image Verification
    let imageVerification = data.imageVerification;
    if (!imageVerification) {
      try {
        imageVerification = await aiService.verifyImage({
          image: rawMedia[0],
          title: data.title,
          description: data.description,
          domain: data.domain,
          district: data.district,
        });
      } catch (err: any) {
        logger.warn('Gemini image verification warning during problem creation:', err.message);
      }
    }

    if (imageVerification && imageVerification.isValid === false && imageVerification.confidence >= 75) {
      throw new Error(`Image verification failed: ${imageVerification.relevanceExplanation || 'The uploaded photo was rejected as invalid evidence by AI verification.'}`);
    }

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
    const mediaUrls = rawMedia;

    const detectedTags = imageVerification?.detectedElements || [];
    const baseTags = [data.domain, data.district, 'Grassroots Challenge'];
    const combinedTags = Array.from(new Set([...baseTags, ...detectedTags]));

    const aiAnalysis = data.aiAnalysis || {
      category: data.domain,
      subCategory: 'Citizen Societal Need',
      priorityScore: 85,
      urgencyLevel: data.urgency || 'High',
      thematicTags: combinedTags,
      recommendedTech: ['Low cost field prototype', 'Local community co-management'],
      nepRelevance: 'Multidisciplinary Student Project (NEP 2020)',
      estimatedBudgetBand: '₹2.0 Lakhs - ₹4.0 Lakhs',
      socialImpactPotential: imageVerification?.imageSummary
        ? `Visual evidence verified (${imageVerification.imageSummary}). Measurable community wellbeing improvement.`
        : 'Measurable improvement in community wellbeing',
    };

    const problem = await prisma.problem.create({
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
    return this.mapProblem(problem);
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

  /** Convert database column names into the frontend's problem contract. */
  private mapProblem(problem: any) {
    const hasCoordinates = Number.isFinite(problem.locationLat) && Number.isFinite(problem.locationLng);
    return {
      ...problem,
      locationCoords: hasCoordinates
        ? {
            lat: problem.locationLat,
            lng: problem.locationLng,
            address: problem.locationAddress || undefined,
          }
        : undefined,
      submittedBy: {
        name: problem.submitterName,
        type: problem.submitterType,
        contact: problem.submitterContact,
        email: problem.submitterEmail,
        organization: problem.submitterOrg || undefined,
      },
      mediaUrls: problem.mediaAttachments?.map((attachment: { url: string }) => attachment.url) || [],
    };
  }
}

export const problemsService = new ProblemsService();
