const { app } = require('@azure/functions');
const { AzureOpenAI } = require('openai');
const ContentSafetyClient = require('@azure-rest/ai-content-safety').default;
const { isUnexpected } = require('@azure-rest/ai-content-safety');
const { AzureKeyCredential } = require('@azure/core-auth');
const { createCorsResponse } = require('../utils/cors');

const HIGH_RISK_SEVERITY = 4;

const CRISIS_RESPONSE = [
    "I'm really sorry you're going through this. I want to support you and help you stay safe right now.",
    "",
    "If you might act on these thoughts or you're in immediate danger, call emergency services now.",
    "If you can, do one of these right away:",
    "- Move away from anything you could use to hurt yourself",
    "- Go to a place where another person is nearby",
    "- Call or text someone you trust and say: \"I'm not safe being alone right now\"",
    "",
    "If you're in Canada or the U.S., call or text 988 now for immediate crisis support.",
    "If you're elsewhere, tell me your country and I can help find the right crisis line.",
    "",
    "You can reply with one word if that's easiest: safe or not safe.",
].join('\n');

const aiClient = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.OPENAI_API_VERSION || "2025-04-01-preview",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT
});

function getLatestUserMessage(messages) {
    if (!Array.isArray(messages)) return '';

    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const item = messages[index];
        if (item?.role === 'user' && typeof item.content === 'string') {
            return item.content.trim();
        }
    }

    return '';
}

function getContentSafetyConfig() {
    const endpoint = (process.env.AZURE_CONTENT_SAFETY_ENDPOINT || '').replace(/\/+$/, '');
    const apiKey = process.env.AZURE_CONTENT_SAFETY_KEY || '';
    return { endpoint, apiKey };
}

async function analyzeWithContentSafety(text) {
    const { endpoint, apiKey } = getContentSafetyConfig();
    if (!endpoint || !apiKey || !text) {
        return null;
    }

    const credential = new AzureKeyCredential(apiKey);
    const client = ContentSafetyClient(endpoint, credential);
    const result = await client.path('/text:analyze').post({
        body: {
            text,
            categories: ['SelfHarm', 'Violence'],
            outputType: 'FourSeverityLevels',
        }
    });

    if (isUnexpected(result)) {
        const details = JSON.stringify(result.body);
        const error = new Error(`Content Safety request failed: ${result.status} ${details}`);
        error.status = Number(result.status) || 500;
        throw error;
    }

    return result.body;
}

function getCategorySeverity(result, categoryName) {
    const match = result?.categoriesAnalysis?.find((item) => item.category === categoryName);
    return typeof match?.severity === 'number' ? match.severity : 0;
}

function isHighRiskSafetyResult(result) {
    const selfHarmSeverity = getCategorySeverity(result, 'SelfHarm');
    const violenceSeverity = getCategorySeverity(result, 'Violence');
    return selfHarmSeverity >= HIGH_RISK_SEVERITY || violenceSeverity >= HIGH_RISK_SEVERITY;
}

function isSafetyPolicyError(error) {
    const message = `${error?.message || ''}`.toLowerCase();
    return (
        message.includes('content filter') ||
        message.includes('content policy') ||
        message.includes('self-harm') ||
        message.includes('suicide')
    );
}

app.http('chat', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            if (request.method === 'OPTIONS') {
                return createCorsResponse(request, { status: 204 });
            }

            const body = await request.json();
            const { userId, messages } = body;

            // 1. Strict input validation
            if (!userId || !messages || !Array.isArray(messages)) {
                return createCorsResponse(request, {
                    status: 400, 
                    jsonBody: { error: "Missing required fields: userId or a valid messages array" } 
                });
            }

            const latestUserMessage = getLatestUserMessage(messages);
            const safetyResult = await analyzeWithContentSafety(latestUserMessage);

            if (safetyResult) {
                context.log(`Content Safety result: ${JSON.stringify(safetyResult)}`);
            }

            if (isHighRiskSafetyResult(safetyResult)) {
                return createCorsResponse(request, {
                    status: 200,
                    jsonBody: {
                        status: "success",
                        data: {
                            role: "assistant",
                            content: CRISIS_RESPONSE
                        },
                        safety: {
                            highRisk: true,
                            source: 'azure-content-safety'
                        }
                    }
                });
            }

            // 2. System Prompt definition (Injecting project context)
            const systemPrompt = {
                role: "developer",
                content: [
                    "You are MindMate, an empathetic and professional AI assistant for university students.",
                    "Your role is to support students who feel stressed, anxious, overwhelmed, or discouraged.",
                    "Respond with empathy, validation, and practical next steps when appropriate.",
                    "Be warm and human, not cold or overly clinical.",
                    "If the user shares painful feelings, acknowledge them gently and stay supportive."
                ].join(' ')
            };

            // 3. Construct the full message array
            const conversationHistory = [systemPrompt, ...messages];

            context.log(`⏳ Requesting completion from Azure OpenAI for user: ${userId}...`);

            // 4. Call Azure OpenAI Responses API
            const response = await aiClient.responses.create({
                model: process.env.AZURE_OPENAI_DEPLOYMENT,
                input: conversationHistory,
                temperature: 0.7,
                max_output_tokens: 800
            });

            const aiResponseText = response.output_text || "";

            // 5. Return standard response
            return createCorsResponse(request, {
                status: 200, 
                jsonBody: {
                    status: "success",
                    data: {
                        role: "assistant",
                        content: aiResponseText
                    },
                    safety: {
                        highRisk: false,
                        source: safetyResult ? 'azure-content-safety' : 'not-configured'
                    }
                } 
            });

        } catch (error) {
            context.log('🔴 Chat API Error:', error.message);
            
            if (isSafetyPolicyError(error)) {
                return createCorsResponse(request, {
                    status: 200,
                    jsonBody: {
                        status: "success",
                        data: {
                            role: "assistant",
                            content: CRISIS_RESPONSE
                        },
                        safety: {
                            highRisk: true,
                            source: 'openai-policy-fallback'
                        }
                    }
                });
            }

            // Differentiate between OpenAI API errors and code errors
            const statusCode = error.status || 500;
            return createCorsResponse(request, {
                status: statusCode, 
                jsonBody: { 
                    error: "AI Service Error", 
                    details: error.message 
                } 
            });
        }
    }
});
