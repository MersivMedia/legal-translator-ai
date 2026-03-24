const { OpenAI } = require('openai');

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

    const { text: essayPrompt } = req.body;

    if (!essayPrompt || essayPrompt.trim().length === 0) {
        return res.status(400).json({ error: 'Essay prompt is required' });
    }

    try {
        // If no OpenAI API key, return demo response
        if (!openai) {
            console.log('No OpenAI API key found, returning demo response for essay');
            return res.json({
                essay: "# The Power of Renewable Energy: A Sustainable Future\n\nIn an era of climate change and environmental consciousness, renewable energy has emerged as a critical solution for our planet's future. This essay explores the compelling benefits of renewable energy, focusing on environmental impact, economic advantages, and long-term sustainability.\n\n## Environmental Benefits\n\nRenewable energy sources like solar, wind, and hydroelectric power produce virtually no greenhouse gas emissions during operation. Unlike fossil fuels, which release harmful pollutants and carbon dioxide, renewable sources help reduce our carbon footprint and combat global warming. Studies show that widespread adoption of renewable energy could reduce global CO2 emissions by up to 70% by 2050.\n\n## Economic Advantages\n\nContrary to popular belief, renewable energy has become increasingly cost-effective. Solar panel costs have dropped by over 80% in the past decade, making it cheaper than coal in many regions. The renewable energy sector also creates jobs at a faster rate than traditional energy industries, with over 13 million people employed in renewable energy worldwide.\n\n## Future Sustainability\n\nUnlike finite fossil fuel reserves, renewable energy sources are inexhaustible. The sun will shine, the wind will blow, and rivers will flow for billions of years. Investing in renewable infrastructure today ensures energy security for future generations while reducing dependence on volatile fossil fuel markets.\n\n## Conclusion\n\nRenewable energy represents more than just an alternative to fossil fuels—it's a pathway to a sustainable, economically viable, and environmentally responsible future. As college students who will inherit this planet, supporting renewable energy initiatives is both a practical and moral imperative for creating lasting positive change.",
                wordCount: 287,
                readingTime: "2-3 minutes",
                structure: [
                    "Clear thesis statement",
                    "Three main supporting arguments", 
                    "Evidence-based reasoning",
                    "Strong conclusion with call to action"
                ]
            });
        }

        // Real OpenAI API call
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a professional essay writer and academic writing expert. Create well-structured, original essays with clear thesis statements, supporting arguments, and proper academic formatting. Use engaging introductions, logical paragraph flow, evidence-based reasoning, and strong conclusions. Format in markdown with proper headings."
                },
                {
                    role: "user", 
                    content: `Generate a comprehensive essay based on these requirements: ${essayPrompt}\n\nRequirements:\n1. Create a well-structured essay in markdown format with clear headings\n2. Include a strong thesis statement and supporting arguments\n3. Use evidence-based reasoning and examples\n4. Write engaging content appropriate for the target audience\n5. Ensure proper academic structure (intro, body, conclusion)\n6. Make it original and plagiarism-free\n\nPlease provide the complete essay with proper formatting.`
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });

        const essayContent = completion.choices[0].message.content;
        
        // Extract word count (approximate)
        const wordCount = essayContent.split(/\s+/).length;
        
        // Calculate reading time (average 200-250 words per minute)
        const readingMinutes = Math.ceil(wordCount / 225);
        const readingTime = readingMinutes === 1 ? "1 minute" : `${readingMinutes} minutes`;
        
        // Identify structure elements
        const structure = [];
        if (essayContent.includes('#')) structure.push("Clear section headings");
        if (essayContent.toLowerCase().includes('conclusion')) structure.push("Conclusion paragraph");
        if (essayContent.split('\n\n').length > 3) structure.push("Multi-paragraph structure");
        structure.push("Logical argument flow");

        res.json({
            essay: essayContent,
            wordCount: wordCount,
            readingTime: readingTime,
            structure: structure
        });

    } catch (error) {
        console.error('Essay generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate essay',
            details: error.message 
        });
    }
}