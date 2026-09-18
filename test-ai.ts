import { ENV } from './server/config/env';
import { aiService } from './server/modules/ai/ai.service';
import { gemini } from './server/utils/gemini';
import { prisma } from './server/config/db';

async function testGemini() {
  console.log('Testing Gemini API key:', ENV.GEMINI_API_KEY ? 'Present' : 'Missing');
  try {
    console.log('\n--- Testing analyzeProblem ---');
    const analysis = await aiService.analyzeProblem({
      title: 'Test problem',
      description: 'This is a test problem about agriculture in rural areas.',
      district: 'Ranchi',
      domain: 'Agriculture',
      blockOrPanchayat: 'Block A',
      affectedPopulation: 500,
      urgency: 'High'
    });
    console.log('Analysis Result Keys:', Object.keys(analysis));
    
    console.log('\n--- Testing generateContent directly ---');
    const simpleText = await gemini.generateContent('Say hello world');
    console.log('generateContent result:', simpleText);
    
    console.log('\n--- Testing embedContent directly ---');
    const embedResult = await gemini.embedContent('hello world');
    console.log('embedContent result length:', embedResult.length);

    console.log('\n--- Testing generateProposal (using hardcoded DB IDs if any, skip if not possible) ---');
    // We will just do a direct call to test the prompt logic if needed. But aiService.generateProposal requires problemId and heiId from DB.
    // Let's fetch one problem and one university from DB.
    const problem = await prisma.problem.findFirst();
    const uni = await prisma.university.findFirst();
    
    if (problem && uni) {
      console.log(`Generating proposal for problem ${problem.id} and university ${uni.id}...`);
      const proposal = await aiService.generateProposal(problem.id, uni.id);
      console.log('Proposal Result Keys:', Object.keys(proposal));
    } else {
      console.log('Skipping generateProposal because DB is empty.');
    }

  } catch (error) {
    console.error('Gemini Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGemini();
