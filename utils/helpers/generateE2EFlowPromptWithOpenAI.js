import OpenAI from 'openai';

/**
 * Generates E2E test confirmation using OpenAI API
 * @param {string} commentBody - The user's comment/request
 * @param {string[]} rules - Array of rules for E2E generation
 * @param {string} userLogin - GitHub username of the commenter
 * @returns {Promise<string>} Formatted confirmation body
 */
export async function generateE2EFlowPromptWithOpenAI(commentBody, rules, userLogin) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set in environment');
    throw new Error('OPENAI_API_KEY not set in environment');
  }

  const openai = new OpenAI({ apiKey });

  console.log('OpenAI API Key present:', !!apiKey);
  console.log('Comment body:', commentBody.substring(0, 100) + (commentBody.length > 100 ? '...' : ''));

  const messages = [
    {
      role: "system",
      content: `You are an expert E2E test script generator. Based on the following rules and context, generate an E2E test script and steps for the user's request.

Rules and context:
${rules.join('\n')}

The Rules and context section above provides essential information about:
- SOM (Screen Object Model) metadata for understanding app screens and flows
- Available user types (new/returning/existing_new) and their environment variables
- Navigation paths between screens
- How E2E commands are structured and executed
- Flow keywords and descriptions for matching user requests

IMPORTANT: Analyze and understand the SOM (Screen Object Model) metadata provided in the rules. Use this metadata to:
- Identify available screens and their navigation paths
- Select appropriate flows based on user types (new/returning/existing_new)
- Include correct environment variables from flow metadata
- Ensure navigation follows expected paths
- Match user requests with flow keywords and descriptions

TEST SELECTION RULES (follow these exactly like the test utility):
- Use deterministic flow matching with priority order
- Match user instructions to flows using keywords and user types from metadata
- Build navigation paths from Landing (entry point) to target screens
- Include correct environment variables: EXISTING_USER_PHONE_NUMBER, NEW_USER_PHONE_NUMBER, EXISTING_NEW_USER_PHONE_NUMBER, DEV_USER_OTP
- Generate E2E_TEST_FILTER based on screens in navigation path
- Ensure navigation follows expected paths from SOM metadata

FLOW MATCHING PRIORITY (highest to lowest):
1. Exact flow name match (e.g., "login with phone number for returning user")
2. Metadata keywords match (check flow.keywords array)
3. User type match (new/returning/existing_new)
4. Step description match (only if no metadata matches found)

Please respond with ONLY a JSON object containing:
- "scriptBlock": A string with the complete E2E test script in a code block format (e.g., \`\`\`sh\nE2E_TEST_FILTER=...\nE2E_FLOW_LANDING="flow description"\n...\n\`\`\`). The script must include E2E_FLOW_LANDING variable with a descriptive flow name.
- "e2eSteps": An array of strings describing the test steps.

IMPORTANT: Return ONLY the JSON object, no additional text, explanations, or formatting.

Example response:
{"scriptBlock": "\`\`\`sh\nE2E_TEST_FILTER=LandingPage,VerifyOtpPage \\\\\n  E2E_FLOW_LANDING=\"login with phone number for returning user\" \\\\\n  PLATFORM=ios \\\\\n  DEV=true \\\\\n  yarn test:ios:dev\n\`\`\`", "e2eSteps": ["Step 1", "Step 2"]}`
    },
    {
      role: "user",
      content: commentBody
    }
  ];

  console.log('Making OpenAI API request...');
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: messages,
    temperature: 0.7,
  });

  console.log('OpenAI API response received successfully');

  const content = completion.choices[0].message.content;
  console.log('OpenAI response content length:', content.length);

  let cursorData;
  try {
    cursorData = JSON.parse(content);
    console.log('Parsed JSON response successfully');
  } catch (parseError) {
    console.error('Failed to parse OpenAI response as JSON:', content);
    throw new Error('OpenAI response is not valid JSON');
  }

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