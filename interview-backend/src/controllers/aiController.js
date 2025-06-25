const { GoogleGenerativeAI } = require("@google/generative-ai");
const stringSimilarity = require('string-similarity');
const config = require('../config');

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(config.geminiAPIKey);

// --- Task-Specific AI Configurations ---
const questionGenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
};
const answerAnalysisConfig = {
  temperature: 0.0,
  maxOutputTokens: 4096,
};

async function generateInterviewFromJD(jobDescription, numberOfQuestions) {
  console.log(`Generating ${numberOfQuestions} questions with creative config...`);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: questionGenerationConfig });
  const prompt = `
    You are an expert technical recruiter. Your task is to create a structured interview based on the provided job description.
    Generate exactly ${numberOfQuestions} diverse questions.
    For each question, you MUST provide the following fields in a valid JSON object:
    - "questionText": The full text of the question.
    - "questionType": One of "technical", "behavioral", or "situational".
    - "difficulty": One of "easy", "medium", or "hard".
    - "timeLimitSeconds": An appropriate time limit in seconds (e.g., 180 for easy, 300 for medium, 450 for hard).
    - "idealAnswer": A detailed, expert-level ideal answer to the question.
    - "keywords": An array of 5-10 essential keywords or concepts from the ideal answer for scoring.
    Your entire response MUST be a single, valid JSON array of these question objects, with no surrounding text or markdown.
  `;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating interview from AI:", error);
    throw new Error("Failed to generate interview questions from the provided job description.");
  }
}

const processAnswer = async (userTranscription, questionDetails) => {
  const coreConcepts = questionDetails.keywords;
  const conceptAnalysis = await getSemanticConceptAnalysis(userTranscription, coreConcepts);

  // --- SCORE CALCULATION (0-1 scale) ---
  const aiKeywordScoreDecimal = conceptAnalysis.mentionedConcepts.length / (coreConcepts.length || 1);
  const semanticDiceScoreDecimal = stringSimilarity.compareTwoStrings(userTranscription.toLowerCase(), questionDetails.idealAnswer.toLowerCase());

  // --- WEIGHTED AVERAGE (0-1 scale) ---
  const weights = { keyword: 0.80, semantic: 0.20 };
  const finalWeightedScoreDecimal = (aiKeywordScoreDecimal * weights.keyword) + (semanticDiceScoreDecimal * weights.semantic);
  
  // --- CONVERT ALL SCORES TO PERCENTAGES (0-100 scale) for the frontend ---
  const finalWeightedScore = finalWeightedScoreDecimal * 100;
  const aiKeywordScore = aiKeywordScoreDecimal * 100;
  const semanticDiceScore = semanticDiceScoreDecimal * 100;

  // --- DETERMINE VERDICT ---
  const CORRECTNESS_THRESHOLD = 65; // A score of 65% or higher is considered correct.
  const isCorrect = finalWeightedScore >= CORRECTNESS_THRESHOLD;

  return {
    isCorrect, // Add the boolean verdict
    finalWeightedScore: finalWeightedScore,
    detailedAnalysis: {
      scoreBreakdown: { 
          'AI Keyword Score': aiKeywordScore, 
          'Semantic Similarity': semanticDiceScore 
      },
      feedbackFromAI: { 
          conceptsMentioned: conceptAnalysis.mentionedConcepts, 
          conceptsMissed: conceptAnalysis.missedConcepts 
      },
      userTranscription: userTranscription,
      idealAnswer: questionDetails.idealAnswer
    },
  };
};

async function getSemanticConceptAnalysis(userAnswer, keyConcepts) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: answerAnalysisConfig });
  const prompt = `
    You are a precise AI teaching assistant. Your only job is to determine which of the provided "Key Concepts" are semantically present in the "User's Answer".
    Your entire response must be ONLY the required JSON object, without any markdown.
    User's Answer: "${userAnswer}"
    Key Concepts to check for: ${JSON.stringify(keyConcepts)}
    Respond with a pure JSON object: { "mentionedConcepts": [], "missedConcepts": [] }
  `;
  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json\n|```/g, '').trim();
  return JSON.parse(text);
}

async function generateFinalReport(responses) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: answerAnalysisConfig });
    const simplifiedResponses = responses.map(r => ({
        score: r.aiScore,
        feedback: r.aiFeedback
    }));
    
    const prompt = `
        You are an expert HR manager analyzing an interview. Based on the following scores and feedback snippets for each question, provide a final summary.
        Scores are out of 100.
        Your entire response must be ONLY a valid JSON object with three keys:
        1. "strengths": An array of strings ([String]) summarizing the candidate's key strengths.
        2. "areasForImprovement": An array of strings ([String]) listing concrete areas for improvement.
        3. "recommendation": A single string, which must be one of 'strong_hire', 'hire', 'maybe', or 'no_hire'.

        Interview Data:
        ${JSON.stringify(simplifiedResponses, null, 2)}

        Provide a holistic summary in the required JSON format.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n|```/g, '').trim();
    return JSON.parse(text);
}

module.exports = {
    generateInterviewFromJD,
    processAnswer,
    generateFinalReport,
};