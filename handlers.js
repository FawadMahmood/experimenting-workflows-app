module.exports = (app) => {
  // PR opened/updated
  app.on(['pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened'], async (context) => {
    const { pull_request, repository } = context.payload;
    
    try {
      // Get PR files
      const { data: files } = await context.octokit.pulls.listFiles({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number
      });
      
      const filePath = files.length > 0 ? files[0].filename : 'README.md';
      
      // Post initial review comment
      const body = `🤖 Workflow run started for PR: [${context.runId}](${context.serverUrl}/${repository.owner.login}/${repository.name}/actions/runs/${context.runId})\n\nTo run additional steps, reply to this review comment with any message.\n\nAvailable actions: run tests, deploy, lint, or run additional\n\n*Note: You can reply directly to this comment in the review thread.*`;
      
      await context.octokit.pulls.createReview({
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
      
      app.log.info(`Posted initial comment on PR ${pull_request.number}`);
    } catch (error) {
      app.log.error('Error posting initial comment:', error);
    }
  });

  // Review comment created
  app.on('pull_request_review_comment.created', async (context) => {
    const { comment, pull_request, repository } = context.payload;
    
    // Ignore bot's own comments
    if (comment.user.login === 'github-actions[bot]') return;
    
    // Check if it's a reply to bot's comment
    if (comment.in_reply_to_id) {
      try {
        // Get parent comment
        const { data: parent } = await context.octokit.pulls.getReviewComment({
          owner: repository.owner.login,
          repo: repository.name,
          comment_id: comment.in_reply_to_id
        });
        
        // Check if parent is from bot
        if (parent.user.login === 'github-actions[bot]') {
          // Add thumbs up reaction
          await context.octokit.reactions.createForPullRequestReviewComment({
            owner: repository.owner.login,
            repo: repository.name,
            comment_id: comment.id,
            content: '+1'
          });
          
          app.log.info(`Added reaction to comment ${comment.id}`);
        }
      } catch (error) {
        app.log.error('Error processing reply:', error);
      }
    }
  });
};