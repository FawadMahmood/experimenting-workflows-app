// Helper to read file content from PR branch, fallback to main branch
module.exports = async function readRepoFile(octokit, repository, path, ref) {
  const mainBranch = process.env.MAIN_BRANCH || 'main';
  try {
    const { data: file } = await octokit.rest.repos.getContent({
      owner: repository.owner.login,
      repo: repository.name,
      path,
      ref
    });
    return Buffer.from(file.content, file.encoding).toString('utf8');
  } catch (err) {
    // Try main branch if not found
    if (err.status === 404) {
      try {
        const { data: file } = await octokit.rest.repos.getContent({
          owner: repository.owner.login,
          repo: repository.name,
          path,
          ref: mainBranch
        });
        return Buffer.from(file.content, file.encoding).toString('utf8');
      } catch (mainErr) {
        console.error(`Could not read ${path} from main branch:`, mainErr);
        return null;
      }
    } else {
      console.error(`Could not read ${path} from branch ${ref}:`, err);
      return null;
    }
  }
};
