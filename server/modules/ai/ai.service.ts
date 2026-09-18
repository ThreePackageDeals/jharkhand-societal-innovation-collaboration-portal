import { gemini } from '../../utils/gemini';
import { logger } from '../../utils/logger';
import { problemsService } from '../problems/problems.service';
import { universityService } from '../universities/universities.service';
import { cosineSimilarity } from '../../utils/math';

export class AIService {
  async transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
    return gemini.transcribeAudio(audioBase64, mimeType);
  }

  private async parseImageInput(imageInput: string): Promise<{ base64: string; mimeType: string }> {
    if (imageInput.startsWith('data:')) {
      const match = imageInput.match(/^data:([^;,]+);base64,(.*)$/s);
      if (match) {
        return {
          mimeType: match[1],
          base64: match[2].replace(/\s/g, ''),
        };
      }
    }

    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const response = await fetch(imageInput);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL (${response.status})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return { base64, mimeType };
    }

    if (imageInput.startsWith('/uploads/') || imageInput.startsWith('uploads/')) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const cleanPath = imageInput.startsWith('/') ? imageInput.slice(1) : imageInput;
      const fullPath = path.join(process.cwd(), cleanPath);
      const buffer = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      return { base64: buffer.toString('base64'), mimeType };
    }

    return {
      base64: imageInput.replace(/\s/g, ''),
      mimeType: 'image/jpeg',
    };
  }

  async verifyImage(data: {
    image: string;
    title?: string;
    description?: string;
    domain?: string;
    district?: string;
  }) {
    if (!data.image) {
      throw new Error('Image data or URL is required');
    }

    if (!gemini.isConfigured()) {
      return {
        isValid: true,
        confidence: 85,
        imageSummary: 'Field photo accepted (AI verification running in offline mode)',
        relevanceExplanation: 'Image successfully attached as grassroots evidence.',
        detectedElements: ['field-photo', 'citizen-evidence'],
        qualityScore: 85,
      };
    }

    try {
      const { base64, mimeType } = await this.parseImageInput(data.image);
      return await gemini.verifyImage(base64, mimeType, {
        title: data.title,
        description: data.description,
        domain: data.domain,
        district: data.district,
      });
    } catch (err: any) {
      logger.error('[AI Service] Image verification error:', err.message);
      throw err;
    }
  }

  async checkDuplicate(data: {
    title: string;
    description: string;
    district?: string;
    blockOrPanchayat?: string;
    domain?: string;
  }) {
    const allProblems = await problemsService.getAllProblems({});
    const legacyMatches = this.findLegacyTextMatches(data, allProblems);

    if (!gemini.isConfigured()) {
      return {
        checkedWithAI: false,
        embedding: [],
        duplicateMatches: legacyMatches,
      };
    }

    const textToEmbed = [
      data.title,
      data.description,
      data.domain && `Domain: ${data.domain}`,
      data.district && `District: ${data.district}`,
      data.blockOrPanchayat && `Location: ${data.blockOrPanchayat}`,
    ].filter(Boolean).join('\n');

    try {
      const embedding = await gemini.embedContent(textToEmbed);

      const embeddingMatches = allProblems
        .filter((problem: any) => Array.isArray(problem.embedding) && problem.embedding.length > 0)
        .map((problem: any) => {
          try {
            return {
              problemId: problem.id,
              title: problem.title,
              similarity: Math.round(cosineSimilarity(embedding, problem.embedding) * 100),
              district: problem.district,
            };
          } catch {
            return null;
          }
        })
        .filter((match): match is {
          problemId: string;
          title: string;
          similarity: number;
          district: string;
        } => Boolean(match) && match.similarity >= 75)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      const duplicateMatches = [
        ...embeddingMatches,
        ...legacyMatches,
      ]
        .sort((a, b) => b.similarity - a.similarity)
        .filter((match, index, matches) => matches.findIndex((candidate) => candidate.problemId === match.problemId) === index)
        .slice(0, 3);

      return {
        checkedWithAI: true,
        embedding,
        duplicateMatches,
      };
    } catch (err: any) {
      logger.error('AI duplicate check error:', err.message);
      return {
        checkedWithAI: false,
        embedding: [],
        duplicateMatches: legacyMatches,
      };
    }
  }

  private findLegacyTextMatches(data: { title: string; description: string; district?: string; domain?: string }, problems: any[]) {
    const stopWords = new Set(['about', 'after', 'also', 'from', 'have', 'into', 'more', 'that', 'their', 'there', 'this', 'with']);
    const tokenize = (value: string) => new Set(
      value.toLowerCase().match(/[a-z0-9]{4,}/g)?.filter((word) => !stopWords.has(word)) || []
    );
    const candidateWords = tokenize(`${data.title} ${data.description}`);

    return problems
      .filter((problem: any) => !Array.isArray(problem.embedding) || problem.embedding.length === 0)
      .map((problem: any) => {
        const problemWords = tokenize(`${problem.title} ${problem.description}`);
        const sharedWords = [...candidateWords].filter((word) => problemWords.has(word)).length;
        const unionSize = new Set([...candidateWords, ...problemWords]).size;
        const lexicalScore = unionSize ? Math.round((sharedWords / unionSize) * 100) : 0;
        const sameContext = data.district && data.district === problem.district && data.domain === problem.domain;
        const similarity = Math.min(100, lexicalScore + (sameContext ? 15 : 0));

        return {
          problemId: problem.id,
          title: problem.title,
          similarity,
          district: problem.district,
        };
      })
      .filter((match) => match.similarity >= 75);
  }

  async analyzeProblem(data: {
    title: string;
    description: string;
    district: string;
    blockOrPanchayat: string;
    domain: string;
    affectedPopulation: number;
    urgency: string;
  }) {
    if (!gemini.isConfigured()) {
      return this.heuristicFallback(data);
    }

    try {
      const prompt = `You are the chief AI evaluation architect for the Jharkhand Societal Innovation Collaboration Portal (aligned with NEP 2020).
Evaluate the following societal challenge submitted from Jharkhand:

Title: "${data.title}"
Description: "${data.description}"
Reported District: "${data.district || 'Not specified'}"
Block/Panchayat: "${data.blockOrPanchayat || 'Not specified'}"
User-selected domain: "${data.domain || 'Not specified'}"
Reported Affected Population: "${data.affectedPopulation || 'Unknown'}"
Reported Urgency: "${data.urgency || 'High'}"

List of key Jharkhand Universities:
- Birla Institute of Technology (BIT) Mesra (Civil, Water Resources, IoT, Remote Sensing, Renewable Energy, ACIC Incubation)
- Indian Institute of Technology (ISM) Dhanbad (Mining, Environment, Water Management, Geophysics, Energy)
- Birsa Agricultural University (BAU) Ranchi (Agronomy, Soil Science, Horticulture, Forestry, Post-harvest, Agri-incubator)
- National Institute of Technology (NIT) Jamshedpur (Mechanical, Automation, Civil, Heavy Metal treatment, Mobility)
- Central University of Jharkhand (CUJ) Ranchi (Tribal Livelihoods, Indigenous Knowledge, Energy Engg, Education)
- AIIMS Deoghar (Public health, Telemedicine, Maternal health, Diagnostics)
- Rajendra Institute of Medical Sciences (RIMS) Ranchi (Community medicine, Bio-monitoring)
- Sido Kanhu Murmu University (SKMU) Dumka (Sericulture, Agro-forestry, Santhal crafts)

Return a strict JSON object with:
{
  "category": (one of: 'agriculture', 'water_resources', 'healthcare', 'education', 'environment_forest', 'renewable_energy', 'sanitation', 'rural_livelihoods', 'urban_infrastructure', 'accessibility', 'public_administration'),
  "subCategory": "concise technical subcategory",
  "priorityScore": (number between 60 and 98 based on social impact, severity, vulnerability),
  "urgencyLevel": ("Critical" | "High" | "Medium" | "Low"),
  "thematicTags": ["tag1", "tag2", "tag3", "tag4"],
  "matchedHeis": [
    {
      "universityId": ("hei-bit-mesra" | "hei-iit-ism-dhanbad" | "hei-bau-ranchi" | "hei-nit-jamshedpur" | "hei-cuj-ranchi" | "hei-aiims-deoghar" | "hei-skmu-dumka" | "hei-rims-ranchi"),
      "universityName": "University name",
      "department": "Target specialized department",
      "matchScore": (number between 75 and 99),
      "reason": "Clear explanation of faculty/lab alignment"
    }
  ],
  "recommendedTech": ["tech recommendation 1", "tech recommendation 2", "tech recommendation 3"],
  "nepRelevance": "Explanation of how students gain experiential learning credits, capstone or multidisciplinary research under NEP 2020",
  "estimatedBudgetBand": "estimated INR prototype cost range (e.g. ₹2.5 Lakhs - ₹4.5 Lakhs)",
  "socialImpactPotential": "measurable outcome for Jharkhand citizens"
}`;

      const rawText = await gemini.generateContent(prompt);
      const parsed = JSON.parse(rawText);

      return {
        ...parsed,
        duplicateMatches: [],
      };
    } catch (err: any) {
      logger.error('AI analysis error:', err.message);
      return this.heuristicFallback(data);
    }
  }

  private heuristicFallback(data: any) {
    const textLower = (data.title + ' ' + data.description).toLowerCase();
    let category = data.domain || 'agriculture';
    let subCategory = 'Community Rural Innovation';
    let matchedHeis = [
      { universityId: 'hei-bit-mesra', universityName: 'BIT Mesra', department: 'Civil & Water Resources', matchScore: 92, reason: 'Strong multi-disciplinary laboratory and innovation centre' },
    ];
    let recommendedTech = ['IoT low-power sensor telemetry', 'Solar-powered decentralized processing unit'];

    if (textLower.includes('water') || textLower.includes('fluoride')) {
      category = 'water_resources';
      subCategory = 'Groundwater Contaminant Remediation';
      matchedHeis = [
        { universityId: 'hei-bit-mesra', universityName: 'BIT Mesra', department: 'Civil & Water Resources', matchScore: 96, reason: 'Specialized faculty lab' },
      ];
    }

    return {
      category,
      subCategory,
      priorityScore: 85,
      urgencyLevel: data.urgency || 'High',
      thematicTags: [subCategory, 'NEP Experiential Project', data.district, 'Social Innovation'],
      matchedHeis,
      duplicateMatches: [],
      recommendedTech,
      nepRelevance: 'Aligned with NEP 2020 Multidisciplinary Social Immersion.',
      estimatedBudgetBand: '₹2.0 Lakhs - ₹4.0 Lakhs',
      socialImpactPotential: 'Measurable improvement in community wellbeing',
    };
  }

  async generateProposal(problemId: string, heiId: string, customInstructions?: string) {
    const problem = await problemsService.getProblemById(problemId);
    const hei = await universityService.getUniversityById(heiId);

    if (!problem || !hei) throw new Error('Problem or University not found');

    if (!gemini.isConfigured()) {
      return this.proposalHeuristicFallback(problem, hei);
    }

    try {
      const prompt = `You are a Senior Research Dean & NEP 2020 Innovation Director at ${hei.name}.
Formulate a formal Multidisciplinary Research & Innovation Proposal to solve:
Challenge Title: "${problem.title}"
Location: ${problem.blockOrPanchayat}, ${problem.district}
Domain: ${problem.domain}
Description: "${problem.description}"

Return a strict JSON response matching the Proposal schema...`;

      const rawText = await gemini.generateContent(prompt);
      return this.normalizeProposalDraft(JSON.parse(rawText), problem, hei);
    } catch (err: any) {
      logger.error('AI proposal generation error:', err.message);
      return this.proposalHeuristicFallback(problem, hei);
    }
  }

  private proposalHeuristicFallback(problem: any, hei: any) {
    return this.normalizeProposalDraft({}, problem, hei);
  }

  /**
   * Gemini can return a valid JSON object that is still missing optional
   * proposal sections. Keep the form usable by filling every field with a
   * domain-aware, editable default before returning it to the client.
   */
  private normalizeProposalDraft(partial: any, problem: any, hei: any) {
    const source = partial && typeof partial === 'object' ? partial : {};
    const firstFaculty = Array.isArray(hei.facultyMentors) ? hei.facultyMentors[0] : undefined;
    const departments = Array.isArray(hei.departments) && hei.departments.length > 0
      ? hei.departments.slice(0, 2)
      : ['Multidisciplinary Innovation'];
    const emailDomain = String(hei.shortName || hei.name || 'university')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '') + '.ac.in';
    const facultyMentor = source.facultyMentor && typeof source.facultyMentor === 'object'
      ? source.facultyMentor
      : {};
    const studentTeam = source.studentTeam && typeof source.studentTeam === 'object'
      ? source.studentTeam
      : {};
    const sourceBudget = source.budgetBreakdown && typeof source.budgetBreakdown === 'object'
      ? source.budgetBreakdown
      : {};
    const hardwareEquip = Number(sourceBudget.hardwareEquip) || 140000;
    const prototyping = Number(sourceBudget.prototyping) || 100000;
    const fieldTesting = Number(sourceBudget.fieldTesting) || 60000;
    const travelAndLogistics = Number(sourceBudget.travelAndLogistics) || 40000;
    const contingency = Number(sourceBudget.contingency) || 40000;
    const milestones = Array.isArray(source.milestones) && source.milestones.length > 0
      ? source.milestones
      : [
          { id: 'm-1', title: 'Problem Diagnosis & Design', stage: 'Ideation & Design', durationWeeks: 4, status: 'in_progress', deliverable: 'Validated requirements and design brief' },
          { id: 'm-2', title: 'Prototype Development', stage: 'Lab Prototype', durationWeeks: 6, status: 'pending', deliverable: 'Working prototype and test report' },
          { id: 'm-3', title: 'Community Field Trial', stage: 'Field Testing', durationWeeks: 6, status: 'pending', deliverable: 'Field results and community feedback' },
          { id: 'm-4', title: 'Pilot Handover', stage: 'Community Pilot', durationWeeks: 4, status: 'pending', deliverable: 'Training, SOP and handover report' },
        ];

    return {
      projectTitle: String(source.projectTitle || `Project Samadhan: ${problem.title}`),
      abstract: String(source.abstract || `A multidisciplinary initiative by ${hei.name} to address ${problem.title} through community-led design, field validation and a scalable implementation model.`),
      technologyMethodology: String(source.technologyMethodology || `1. Validate the challenge with community stakeholders and baseline measurements.\n2. Design and prototype a context-appropriate intervention using ${problem.domain || 'appropriate local technologies'}.\n3. Test the prototype in ${problem.blockOrPanchayat || problem.district || 'the target community'} and iterate from measured results.\n4. Document the operating model, training needs and scale-up pathway.`),
      facultyMentor: {
        name: (() => {
          const generatedName = typeof facultyMentor.name === 'string' ? facultyMentor.name.trim() : '';
          return generatedName.length >= 3
            ? generatedName
            : String(firstFaculty?.name || 'Faculty Innovation Lead');
        })(),
        department: String(facultyMentor.department || firstFaculty?.department || departments[0]),
        email: String(facultyMentor.email || firstFaculty?.email || `faculty.office@${emailDomain}`),
      },
      studentTeam: {
        leadName: String(studentTeam.leadName || 'Student Research Lead'),
        leadEmail: String(studentTeam.leadEmail || `student.researcher@${emailDomain}`),
        membersCount: Number(studentTeam.membersCount) || 3,
        departments: Array.isArray(studentTeam.departments) && studentTeam.departments.length > 0
          ? studentTeam.departments
          : departments,
      },
      nepExperientialCredits: Number(source.nepExperientialCredits) || 6,
      budgetBreakdown: {
        hardwareEquip,
        prototyping,
        fieldTesting,
        travelAndLogistics,
        contingency,
        totalAmount: hardwareEquip + prototyping + fieldTesting + travelAndLogistics + contingency,
      },
      milestones,
      ipPotential: ['Patentable Technology', 'Open-Source Public Good', 'Process Copyright', 'Grassroots Spinoff'].includes(source.ipPotential)
        ? source.ipPotential
        : 'Open-Source Public Good',
    };
  }
}

export const aiService = new AIService();
