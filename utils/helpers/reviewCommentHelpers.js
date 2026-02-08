/**
 * Reads and logs important repo files for E2E context when a PR review comment is created.
 * - Reads .cursor/rules/e2e-tests-run-command.mdc and e2e/models/som-metadata.ts from the PR branch (with fallback to main).
 * - Logs their contents for debugging or further processing.
 * @param {object} octokit - The authenticated Octokit instance
 * @param {object} repository - The repository object from the webhook payload
 * @param {object} pull_request - The pull request object from the webhook payload
 */
export async function getRulesForGeneratingE2EFlow(octokit, repository, pull_request) {
  // Dynamically import the readRepoFile helper
  const { default: readRepoFile } = await import('./readRepoFile.js');

  // Read and log .cursor/rules/e2e-tests-run-command.mdc from repo (with fallback)
  const e2eTestRule = await readRepoFile(
    octokit,
    repository,
    '.cursor/rules/e2e-tests-run-command.mdc',
    pull_request.head.ref
  );

  // Read and log e2e/models/som-metadata.ts from repo (with fallback)
  const somMetadata = await readRepoFile(
    octokit,
    repository,
    'e2e/models/som-metadata.ts',
    pull_request.head.ref
  );

  return [
    somMetadata || '',
    e2eTestRule || ''
  ];
}

/**
 * Adds an 'eyes' reaction to a comment if it is a reply to a bot's comment.
 * - Checks if the comment is a reply to another comment.
 * - If the parent comment was made by the bot, adds an 'eyes' reaction to the reply.
 * @param {object} octokit - The authenticated Octokit instance
 * @param {object} repository - The repository object from the webhook payload
 * @param {object} comment - The comment object from the webhook payload
 * @param {string} botLogin - The bot's login username
 */
export async function handleBotReplyReaction(octokit, repository, comment, botLogin) {
  if (comment.in_reply_to_id) {
    console.log('Reply detected. Checking parent comment for bot login...');
    try {
      const { data: parent } = await octokit.rest.pulls.getReviewComment({
        owner: repository.owner.login,
        repo: repository.name,
        comment_id: comment.in_reply_to_id
      });
      console.log('Parent comment user:', parent.user.login, 'Expected bot login:', botLogin);
      if (parent.user.login === botLogin) {
        console.log('Parent is bot. Adding reaction...');
        await octokit.rest.reactions.createForPullRequestReviewComment({
          owner: repository.owner.login,
          repo: repository.name,
          comment_id: comment.id,
          content: 'eyes'
        });
        console.log(`Added reaction to comment ${comment.id}`);
      } else {
        console.log('Parent is not bot. No reaction added.');
      }
    } catch (error) {
      console.error('Error processing reply:', error);
    }
  } else {
    console.log('No in_reply_to_id found. Not a reply.');
  }
}
