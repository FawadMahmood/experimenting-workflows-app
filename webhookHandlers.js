import readRepoFile from './utils/helpers/readRepoFile.js';
import { generateWashmenE2EComment } from './utils/helpers/generateWashmenE2EComment.js';
import { getRulesForGeneratingE2EFlow, handleBotReplyReaction } from './utils/helpers/reviewCommentHelpers.js';
import { generateE2EConfirmationComment } from './utils/helpers/generateE2EConfirmationComment.js';
// webhookHandlers.js

export function registerWebhookHandlers(app) {
  // PR opened/updated
  app.webhooks.on(['pull_request.opened'], async ({ octokit, payload }) => {
    const { pull_request, repository } = payload;
    try {
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number
      });
      const filePath = files.length > 0 ? files[0].filename : 'README.md';
      const body = generateWashmenE2EComment(pull_request, repository);
      
      // Pick first file in PR for review comment
      await octokit.rest.pulls.createReview({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        body: '',
        event: 'COMMENT',
        comments: [{
          path: filePath,
          position: 1,
          body: body
        }]
      });
    } catch (error) {
      console.error('Error posting initial comment:', error);
    }
  });

  // Review comment created
  app.webhooks.on('pull_request_review_comment.created', async ({ octokit, payload }) => {
    const { comment, pull_request, repository } = payload;
    const botLogin = process.env.BOT_LOGIN || 'github-actions[bot]';

    console.log('GitHub comment content:', comment.body);

    // read rules for AI to process the user provided prompt for generating E2E flow, 
    // this is needed to provide context to the AI about how to generate the command and what format to follow.
    const rules = await getRulesForGeneratingE2EFlow(octokit, repository, pull_request);
        
    // if the comment is made by the bot itself, ignore to prevent reaction loops
    if (comment.user.login === botLogin) return;

    // Handle adding reaction if it's a reply to a bot comment
    // this is to react to user replies to the bot's initial comment, 
    // making it easier for maintainers to spot them that message is being processed.
    await handleBotReplyReaction(octokit, repository, comment, botLogin);

    // Demo: Add confirmation script comment after reaction
    // These values are hardcoded for demo, but should be dynamically generated in real use
      const flowDescription = 'login with phone number for returning user';
        const contributorTag = `@${comment.user.login}`;
        const scriptBlock = `<E2E_SCRIPT_START>\nE2E_TEST_FILTER=LandingPage,VerifyOtpPage \
       E2E_FLOW_LANDING="${flowDescription}" \
       PLATFORM=ios \
       DEV=true \
       yarn test:ios:dev\n<E2E_SCRIPT_END>`;
      const confirmationBody = generateE2EConfirmationComment(
          `${contributorTag},\n\nWashmen AI has generated the following E2E test script for the flow: \"${flowDescription}\".\n\nIf you would like to proceed and run the E2E tests for this flow, please reply with \"run e2e\".\n\n${scriptBlock}`
      );

    await octokit.rest.pulls.createReply({
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: pull_request.number,
      body: confirmationBody,
      comment_id: comment.id
    });
  });

  app.webhooks.onError((error) => {
    if (error.name === 'AggregateError') {
      console.log(`Error processing request: ${error.event}`);
    } else {
      console.log(error);
    }
  });
}
