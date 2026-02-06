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
      const body = `🤖 Workflow run started for PR actions: [${pull_request.number}](https://github.com/${repository.owner.login}/${repository.name}/pull/${pull_request.number})\n\nTo run additional steps, reply to this review comment with any message.\n\nAvailable actions: run tests, deploy, lint, or run additional\n\n*Note: You can reply directly to this comment in the review thread.*`;
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
    console.log('comment.user.login', comment.user.login, 'botLogin', botLogin);
    if (comment.user.login === botLogin) return;
    if (comment.in_reply_to_id) {
      try {
        const { data: parent } = await octokit.rest.pulls.getReviewComment({
          owner: repository.owner.login,
          repo: repository.name,
          comment_id: comment.in_reply_to_id
        });
        if (parent.user.login === botLogin) {
          await octokit.rest.reactions.createForPullRequestReviewComment({
            owner: repository.owner.login,
            repo: repository.name,
            comment_id: comment.id,
            content: '+1'
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
