const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_LOGIC_URL = process.env.API_LOGIC_URL || 'http://glorybuilder.local/';
const LOGIC_API_KEY = process.env.LOGIC_API_KEY;
const OPENROUTER_API_KEY = process.env.API_OPENROUTER; // Must be provided
const USER_ID = process.env.USER_ID || 1;
const MODEL_NAME = 'google/gemini-3-pro-preview';

// Paths
const LOGIC_MD_PATH = path.join(__dirname, '../../Config/logic-api.md');

async function main() {
    console.log('Starting Logic Agent (OpenRouter/Gemini 3 Pro)...');

    if (!OPENROUTER_API_KEY) {
        console.error('Error: API_OPENROUTER environment variable is missing.');
        process.exit(1);
    }

    // 1. Read Logic API Definition (System Prompt)
    let logicMdContent;
    try {
        logicMdContent = fs.readFileSync(LOGIC_MD_PATH, 'utf8');
    } catch (err) {
        console.error(`Error reading logic-api.md at ${LOGIC_MD_PATH}:`, err);
        process.exit(1);
    }

    // 2. Fetch Current State
    const stateUrl = `${API_LOGIC_URL}/wp-json/glory-logic/v1/state?userId=${USER_ID}&historyLimit=10`;
    console.log(`Fetching state from: ${stateUrl}`);
    
    let currentState;
    try {
        const response = await fetch(stateUrl, {
            headers: {
                'X-Glory-Logic-Key': LOGIC_API_KEY
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentState = await response.json();
    } catch (err) {
        console.error('Error fetching state:', err);
        process.exit(1);
    }

    // 3. Construct Messages for OpenRouter
    const systemInstruction = `
${logicMdContent}

INSTRUCTIONS:
You are the Logic Agent described above. 
Your goal is to analyze the CURRENT STATE and execute the necessary actions based on the "Recomendación para el agente" and your own judgment.
You must output a JSON object containing a list of actions to perform.
The available actions correspond to the API endpoints described in the documentation.

Output Format:
{
    "thoughts": "Your reasoning here...",
    "actions": [
        {
            "method": "POST",
            "endpoint": "/steps",
            "body": { "userId": 1, "titulo": "New Task" }
        }
    ]
}

If no actions are needed, return an empty "actions" list.
IMPORTANT: Output ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
`;

    const userMessage = `
CURRENT STATE (JSON):
${JSON.stringify(currentState, null, 2)}

Please analyze the state and provide the JSON response.
`;

    // 4. Call OpenRouter API
    console.log(`Calling OpenRouter with model ${MODEL_NAME}...`);
    
    let agentResponse;
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://glorybuilder.local", // Optional, for OpenRouter rankings
                "X-Title": "Glory Logic Agent" // Optional
            },
            body: JSON.stringify({
                "model": MODEL_NAME,
                "messages": [
                    {
                        "role": "system",
                        "content": systemInstruction
                    },
                    {
                        "role": "user",
                        "content": userMessage
                    }
                ],
                "reasoning": { "enabled": true }
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
        }
        
        const data = await response.json();
        
        // Extract content
        let content = data.choices[0].message.content;
        
        // Clean up markdown if present
        content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        
        agentResponse = JSON.parse(content);
        
    } catch (err) {
        console.error('Error calling OpenRouter:', err);
        process.exit(1);
    }

    console.log('Agent Thoughts:', agentResponse.thoughts);

    // 5. Execute Actions
    if (agentResponse.actions && agentResponse.actions.length > 0) {
        for (const action of agentResponse.actions) {
            console.log(`Executing ${action.method} ${action.endpoint}...`);
            
            // Construct full URL (handle leading slash)
            const endpoint = action.endpoint.startsWith('/') ? action.endpoint : '/' + action.endpoint;
            const actionUrl = `${API_LOGIC_URL}/wp-json/glory-logic/v1${endpoint}`;
            
            try {
                const res = await fetch(actionUrl, {
                    method: action.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Glory-Logic-Key': LOGIC_API_KEY
                    },
                    body: action.body ? JSON.stringify(action.body) : undefined
                });
                
                const resText = await res.text();
                console.log(`Result: ${res.status} - ${resText}`);
            } catch (err) {
                console.error(`Failed to execute action ${action.endpoint}:`, err);
            }
        }
    } else {
        console.log('No actions to execute.');
    }

    console.log('Done.');
}

main();
