const OpenAI = require('openai');

let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting: 3 document simplifications per day per IP
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const today = new Date().toDateString();
    const rateLimitKey = `${clientIP}_${today}`;
    
    // Simple in-memory rate limiting (in production, use Redis or database)
    if (!global.rateLimitStore) {
        global.rateLimitStore = {};
    }
    
    if (!global.rateLimitStore[rateLimitKey]) {
        global.rateLimitStore[rateLimitKey] = 0;
    }
    
    if (global.rateLimitStore[rateLimitKey] >= 3) {
        return res.status(429).json({ 
            error: 'Rate limit exceeded',
            message: 'You have reached your daily limit of 3 document simplifications. Please try again tomorrow!'
        });
    }
    
    // Increment the counter
    global.rateLimitStore[rateLimitKey]++;

    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: 'Legal document text is required' });
    }

    if (text.length > 5000) {
        return res.status(400).json({ error: 'Text too long. Maximum 5,000 characters allowed.' });
    }

    try {
        // If no OpenAI API key, return demo response
        if (!openai) {
            console.log('No OpenAI API key found, returning demo response for legal simplification');
            return res.json({
                simplified: `This document is a legal agreement where you (the first party) agree to protect and defend another person or company (the second party) from any legal problems, claims, or costs that might come up.

In simple terms:
• If someone sues the second party for something related to this agreement, you will handle the legal costs
• You will pay for any damages or settlements that result from these legal issues  
• You take responsibility for defending them in court if needed

This is called an "indemnification clause" and it's commonly found in service contracts, rental agreements, and business partnerships. It's designed to shift legal risk from one party to another.

**Note: This is a demo response. Add your OpenAI API key to environment variables to get real AI-powered analysis.**`,
                keyPoints: [
                    "You agree to protect the other party from legal claims",
                    "You will pay for legal costs and damages on their behalf", 
                    "This applies to issues related to this specific agreement",
                    "You become responsible for their legal defense in related matters",
                    "This is a standard risk-shifting clause in contracts"
                ],
                risks: [
                    "Unlimited financial liability - costs could be very high",
                    "You could pay for problems you didn't directly cause",
                    "Legal costs can accumulate quickly even for frivolous claims",
                    "You may have little control over how the other party handles situations", 
                    "This clause typically favors the other party heavily"
                ]
            });
        }

        // Real OpenAI API call
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a legal document simplification expert. Your job is to translate complex legal language into plain English that anyone can understand.

Respond with a JSON object containing:
1. "simplified" - A clear, conversational explanation of what the legal text means
2. "keyPoints" - An array of 3-7 important points the user should know
3. "risks" - An array of 3-7 potential concerns or risks they should be aware of

Make your explanation:
- Conversational and easy to understand
- Free of legal jargon
- Practical and actionable
- Around 200-400 words for the simplified explanation
- Focused on what matters most to an average person

Do not provide legal advice. Focus on education and understanding.`
                },
                {
                    role: "user",
                    content: `Please simplify this legal text: ${text}`
                }
            ],
            max_tokens: 2000,
            temperature: 0.3,
        });

        const result = completion.choices[0].message.content;
        const parsedResult = JSON.parse(result);

        res.json(parsedResult);

    } catch (error) {
        console.error('Legal simplification error:', error);
        res.status(500).json({ 
            error: 'Failed to simplify legal document',
            details: error.message 
        });
    }
}