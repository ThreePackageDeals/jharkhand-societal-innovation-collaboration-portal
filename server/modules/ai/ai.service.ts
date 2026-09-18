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
      logger.error('[AI Service] Gemini image verification error:', err.message);
      throw err;
    }
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

      // Semantic Deduplication via embeddings
      const currentEmbedding = await gemini.embedContent(data.description);
      const allProblems = await problemsService.getAllProblems({});

      const duplicateMatches = allProblems
        .filter((p: any) => p.embedding && p.embedding.length > 0)
        .map((p: any) => ({
          problemId: p.id,
          title: p.title,
          similarity: Math.round(cosineSimilarity(currentEmbedding, p.embedding) * 100),
          district: p.district,
        }))
        .filter((match: any) => match.similarity >= 75) // Threshold for duplicate
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3);

      return {
        ...parsed,
        embedding: currentEmbedding,
        duplicateMatches,
      };
    } catch (err: any) {
      logger.error('Gemini AI analysis error:', err.message);
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
      return JSON.parse(rawText);
    } catch (err: any) {
      logger.error('Gemini proposal generation error:', err.message);
      return this.proposalHeuristicFallback(problem, hei);
    }
  }

  private proposalHeuristicFallback(problem: any, hei: any) {
    return {
      projectTitle: `Project Samadhan: ${problem.title.slice(0, 30)}...`,
      abstract: `A multidisciplinary initiative by ${hei.name} to solve ${problem.title}.`,
    };
  }
}

export const aiService = new AIService();
