import readRepoFile from './utils/readRepoFile.js';
// webhookHandlers.js

export function registerWebhookHandlers(app) {
  // PR opened/updated
  app.webhooks.on(['pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened'], async ({ octokit, payload }) => {
    const { pull_request, repository } = payload;
    try {
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number
      });
      const filePath = files.length > 0 ? files[0].filename : 'README.md';
      const body = `🎬 **E2E Test Runner Bot**

Hey there! 🚀

@${pull_request.user.login}, if this PR is ready for interactive E2E testing.

**👇 Please reply to this comment with a plain text prompt describing the E2E test you want to run!**

For example:
> login as new user and verify OTP
> checkout flow for returning user

---
🤖 The AI will generate the E2E test run command for your prompt and ask for your confirmation before executing it.

✨ *Reply directly to this comment with your prompt and I'll handle the rest!* ✨

🔗 [PR #${pull_request.number}](https://github.com/${repository.owner.login}/${repository.name}/pull/${pull_request.number})
`;
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
      console.log(`Posted initial comment on PR ${pull_request.number}`);
    } catch (error) {
      console.error('Error posting initial comment:', error);
    }
  });

  // Review comment created
  app.webhooks.on('pull_request_review_comment.created', async ({ octokit, payload }) => {
    const { comment, pull_request, repository } = payload;
    const botLogin = process.env.BOT_LOGIN || 'github-actions[bot]';
    // Log the content of the comment
    console.log('GitHub comment content:', comment.body);
    // Read and log .cursor/rules/e2e-tests-run-command.mdc from repo (with fallback)
    const e2eTestRule = await readRepoFile(
      octokit,
      repository,
      '.cursor/rules/e2e-tests-run-command.mdc',
      pull_request.head.ref
    );
    if (e2eTestRule) {
      console.log('e2e-tests-run-command.mdc content:', e2eTestRule);
    }
    // Read and log e2e/models/som-metadata.ts from repo (with fallback)
    const somMetadata = await readRepoFile(
      octokit,
      repository,
      'e2e/models/som-metadata.ts',
      pull_request.head.ref
    );
    if (somMetadata) {
      console.log('som-metadata.ts content:', somMetadata);
    }
    // Construct and log the prompt
    if (comment.user.login === botLogin) return;
    if (comment.in_reply_to_id) {
      try {
        const { data: parent } = await octokit.rest.pulls.getReviewComment({
          owner: repository.owner.login,
          repo: repository.name,
          comment_id: comment.in_reply_to_id
        });
        if (parent.user.login === botLogin) {
          // Add reaction
          await octokit.rest.reactions.createForPullRequestReviewComment({
            owner: repository.owner.login,
            repo: repository.name,
            comment_id: comment.id,
            content: 'eyes'
          });
          console.log(`Added reaction to comment ${comment.id}`);
        }
      } catch (error) {
        console.error('Error processing reply:', error);
      }
    }
  });

  app.webhooks.onError((error) => {
    if (error.name === 'AggregateError') {
      console.log(`Error processing request: ${error.event}`);
    } else {
      console.log(error);
    }
  });
}
