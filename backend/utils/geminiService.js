import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Check API key
if (!process.env.GROQ_API_KEY) {
    console.error('FATAL ERROR: GROQ_API_KEY is not set in the environment variables.');
    process.exit(1);
}

/**
 * Helper function to call Groq API
 */
const generateAIResponse = async (prompt) => {
    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 4000,
        });

        return completion.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('Groq API FULL ERROR:', error);

        if (error.response) {
            console.error('Response Data:', error.response.data);
        }

        throw new Error('AI generation failed');
    }
};

/**
 * Generate flashcards from text
 * @param {string} text
 * @param {number} count
 * @returns {Promise<Array>}
 */
export const generateFlashcards = async (text, count = 10) => {
    const prompt = `
Generate exactly ${count} educational flashcards from the following text.

Format each flashcard exactly like this:

Q: [Clear, specific question]
A: [Concise, accurate answer]
D: [easy/medium/hard]

Separate each flashcard with "---"

Text:
${text.substring(0, 15000)}
`;

    try {
        const generatedText = await generateAIResponse(prompt);

        const flashcards = [];
        const cards = generatedText.split('---').filter(c => c.trim());

        for (const card of cards) {
            const lines = card.trim().split('\n');

            let question = '';
            let answer = '';
            let difficulty = 'medium';

            for (const line of lines) {
                const trimmed = line.trim();

                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('A:')) {
                    answer = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();

                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (question && answer) {
                flashcards.push({
                    question,
                    answer,
                    difficulty,
                });
            }
        }

        return flashcards.slice(0, count);
    } catch (error) {
        console.error('Flashcard generation error:', error);
        throw new Error('Failed to generate flashcards');
    }
};

/**
 * Generate quiz questions
 * @param {string} text
 * @param {number} numQuestions
 * @returns {Promise<Array>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
    const prompt = `
Generate exactly ${numQuestions} multiple choice questions from the following text.

Format each question exactly like this:

Q: [Question]
01: [Option 1]
02: [Option 2]
03: [Option 3]
04: [Option 4]
C: [Correct option exactly as written]
E: [Brief explanation]
D: [easy/medium/hard]

Separate questions with "---"

Text:
${text.substring(0, 15000)}
`;

    try {
        const generatedText = await generateAIResponse(prompt);

        const questions = [];
        const blocks = generatedText.split('---').filter(q => q.trim());

        for (const block of blocks) {
            const lines = block.trim().split('\n');

            let question = '';
            let options = [];
            let correctAnswer = '';
            let explanation = '';
            let difficulty = 'medium';

            for (const line of lines) {
                const trimmed = line.trim();

                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();
                } else if (/^0\d:/.test(trimmed)) {
                    options.push(trimmed.substring(3).trim());
                } else if (trimmed.startsWith('C:')) {
                    correctAnswer = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('E:')) {
                    explanation = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();

                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (question && options.length === 4 && correctAnswer) {
                questions.push({
                    question,
                    options,
                    correctAnswer,
                    explanation,
                    difficulty,
                });
            }
        }

        return questions.slice(0, numQuestions);
    } catch (error) {
        console.error('Quiz generation error:', error);
        throw new Error('Failed to generate quiz');
    }
};

/**
 * Generate document summary
 * @param {string} text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
    const prompt = `
Provide a concise summary of the following text.

Highlight:
- Key concepts
- Main ideas
- Important points

Keep the summary clear and structured.

Text:
${text.substring(0, 20000)}
`;

    try {
        return await generateAIResponse(prompt);
    } catch (error) {
        console.error('Summary generation error:', error);
        throw new Error('Failed to generate summary');
    }
};

/**
 * Chat with document context
 * @param {string} question
 * @param {Array<Object>} chunks
 * @returns {Promise<string>}
 */
export const chatWithContext = async (question, chunks) => {
    const context = chunks
        .map((c, i) => `[Chunk ${i + 1}]\n${c.content}`)
        .join('\n\n');

    const prompt = `
Based on the following context from a document, answer the user's question.

If the answer is not present in the context, clearly say so.

Context:
${context}

Question:
${question}

Answer:
`;

    try {
        return await generateAIResponse(prompt);
    } catch (error) {
        console.error('Chat generation error:', error);
        throw new Error('Failed to process chat request');
    }
};

/**
 * Explain a specific concept
 * @param {string} concept
 * @param {string} context
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
    const prompt = `
Explain the concept "${concept}" based on the following context.

Requirements:
- Easy to understand
- Educational
- Include examples if relevant

Context:
${context.substring(0, 10000)}
`;

    try {
        return await generateAIResponse(prompt);
    } catch (error) {
        console.error('Concept explanation error:', error);
        throw new Error('Failed to explain concept');
    }
};