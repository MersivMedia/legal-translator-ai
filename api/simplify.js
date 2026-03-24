export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid input text' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long. Maximum 5,000 characters allowed.' });
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      // Demo mode - return sample response
      const demoResponse = {
        simplified: `Your essay demonstrates strong structural foundation with clear argumentative development. The introduction effectively establishes the thesis while body paragraphs provide supporting evidence and analysis.\n\nKey Analysis:\n• Strong thesis statement that guides the entire essay\n• Well-developed body paragraphs with topic sentences\n• Good use of evidence and examples to support claims\n• Clear transitions that connect ideas logically\n\nThis essay follows the classic five-paragraph structure commonly used in academic writing. It demonstrates solid understanding of persuasive writing techniques and evidence-based argumentation.\n\nNote: This is a demo response. Add your OpenAI API key to environment variables to get real AI-powered essay analysis.`,
        keyPoints: [
          "Clear thesis statement that drives the argument",
          "Strong topic sentences guide each body paragraph", 
          "Good use of evidence and supporting examples",
          "Logical flow and transitions between ideas",
          "Proper conclusion that reinforces main argument"
        ],
        risks: [
          "Consider adding counterarguments to strengthen analysis",
          "Some transitions between paragraphs could be smoother",
          "Conclusion could better synthesize key insights",
          "Additional evidence or examples might support weaker points", 
          "Check for any unclear or overly complex sentences"
        ]
      };
      
      return res.status(200).json(demoResponse);
    }

    // Real OpenAI processing
    const { OpenAI } = require('openai');
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert essay and academic writing analyst. Your job is to analyze essays and provide constructive feedback to help improve writing quality.

Respond with a JSON object containing:
1. "simplified" - A comprehensive analysis of the essay's structure, strengths, and overall effectiveness (200-400 words)
2. "keyPoints" - An array of 3-7 key strengths or positive elements in the essay
3. "risks" - An array of 3-7 suggestions for improvement or areas that could be strengthened

Make your analysis:
- Constructive and encouraging
- Focused on writing technique and structure
- Practical and actionable for improvement
- Educational for developing better writing skills

Focus on thesis development, argument structure, evidence use, transitions, and overall clarity.`
        },
        {
          role: "user",
          content: `Please analyze this essay and provide constructive feedback: ${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = completion.choices[0].message.content;
    const parsedResult = JSON.parse(result);

    return res.status(200).json(parsedResult);

  } catch (error) {
    console.error('Error analyzing essay:', error);
    
    // Fallback to demo response on error
    const demoResponse = {
      simplified: `Your essay demonstrates strong structural foundation with clear argumentative development. The introduction effectively establishes the thesis while body paragraphs provide supporting evidence and analysis.\n\nKey Analysis:\n• Strong thesis statement that guides the entire essay\n• Well-developed body paragraphs with topic sentences\n• Good use of evidence and examples to support claims\n• Clear transitions that connect ideas logically\n\nThis essay follows the classic five-paragraph structure commonly used in academic writing. It demonstrates solid understanding of persuasive writing techniques and evidence-based argumentation.\n\nNote: This is a demo response due to an API error. The service owner should check the OpenAI configuration.`,
      keyPoints: [
        "Clear thesis statement that drives the argument",
        "Strong topic sentences guide each body paragraph", 
        "Good use of evidence and supporting examples",
        "Logical flow and transitions between ideas",
        "Proper conclusion that reinforces main argument"
      ],
      risks: [
        "Consider adding counterarguments to strengthen analysis",
        "Some transitions between paragraphs could be smoother",
        "Conclusion could better synthesize key insights",
        "Additional evidence or examples might support weaker points", 
        "Check for any unclear or overly complex sentences"
      ]
    };
    
    return res.status(200).json(demoResponse);
  }
}