/**
 * Generates E2E test confirmation using Cursor AI API
 * @param {string} commentBody - The user's comment/request
 * @param {string[]} rules - Array of rules for E2E generation
 * @param {string} userLogin - GitHub username of the commenter
 * @returns {Promise<string>} Formatted confirmation body
 */
export async function generateE2EFlowPromptWithCursor(commentBody, rules, userLogin) {
  const cursorAgentId = process.env.CURSOR_AGENT_API_KEY;
  if (!cursorAgentId) {
    console.error('CURSOR_AGENT_API_KEY not set in environment');
    throw new Error('CURSOR_AGENT_API_KEY not set in environment');
  }

  const apiKey = process.env.CURSOR_AGENT_API_KEY;
  if (!apiKey) {
    console.error('CURSOR_AGENT_API_KEY not set in environment');
    throw new Error('CURSOR_AGENT_API_KEY not set in environment');
  }

  console.log('Cursor Agent API Key present:', !!cursorAgentId);
  console.log('Cursor API Key present:', !!apiKey);
  console.log('Comment body:', commentBody.substring(0, 100) + (commentBody.length > 100 ? '...' : ''));

  const prompt = `Based on the following rules and context, generate an E2E test script and steps for the user's request: "${commentBody}".

Rules and context:
${rules.join('\n')}

Please respond with a JSON object containing:
- "scriptBlock": A string with the complete E2E test script in a code block format (e.g., \`\`\`sh\nE2E_TEST_FILTER=...\nE2E_FLOW_LANDING="flow description"\n...\n\`\`\`). The script must include E2E_FLOW_LANDING variable with a descriptive flow name.
- "e2eSteps": An array of strings describing the test steps.

Example response:
{
  "scriptBlock": "\`\`\`sh\nE2E_TEST_FILTER=LandingPage,VerifyOtpPage \\\\\n  E2E_FLOW_LANDING=\"login with phone number for returning user\" \\\\\n  PLATFORM=ios \\\\\n  DEV=true \\\\\n  yarn test:ios:dev\n\`\`\`",
  "e2eSteps": ["Step 1", "Step 2"]
}`;

  const apiUrl = `https://api.cursor.com/agents/${cursorAgentId}/generate`;
  console.log('Cursor API URL:', apiUrl);

  const requestBody = JSON.stringify({ prompt });
  console.log('Request body length:', requestBody.length);

  console.log('Making Cursor API request...');
  const cursorResponse = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: requestBody
  });

  console.log('Cursor API response status:', cursorResponse.status);

  if (!cursorResponse.ok) {
    const errorText = await cursorResponse.text();
    console.error('Cursor API error response body:', errorText);
    throw new Error(`Cursor API error: ${cursorResponse.status} - ${errorText}`);
  }

  const cursorData = await cursorResponse.json();
  console.log('Cursor API response parsed successfully');
  console.log('Response keys:', Object.keys(cursorData));
  console.log('scriptBlock present:', !!cursorData.scriptBlock);
  console.log('e2eSteps present:', !!cursorData.e2eSteps);

  const { scriptBlock, e2eSteps } = cursorData;

  // Extract flow description from the script block
  const flowMatch = scriptBlock.match(/E2E_FLOW_LANDING="([^"]+)"/);
  const flowDescription = flowMatch ? flowMatch[1] : 'Generated E2E Flow';
  console.log('Extracted flow description:', flowDescription);
  console.log('Flow description match found:', !!flowMatch);

  const contributorTag = `@${userLogin}`;
  const stepsList = e2eSteps.map((step, idx) => `\u2022 ${step}`).join('\n');

  return `${contributorTag},\n\n**Washmen AI E2E Test Confirmation**\n\n---\n\n**Flow:** \"${flowDescription}\"\n\n**Test Steps:**\n${stepsList}\n\n---\n\nHere is the generated E2E test script for your review:\n${scriptBlock}\n\n---\n\n**To proceed:**\n- Reply with "run e2e" to start the E2E test. \n- Reply with your feedback or suggestions to modify the flow.\n\nThank you for collaborating with Washmen AI!`;
}