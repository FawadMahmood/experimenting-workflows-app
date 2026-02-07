import { Octokit } from 'octokit';

// Helper to read file content from PR branch, fallback to main branch
export default async function readRepoFile(
  octokit: Octokit,
  repository: any,
  path: string,
  ref: string
): Promise<string | null> {
  const mainBranch = process.env.MAIN_BRANCH || 'main';
  try {
    const { data: file } = await octokit.rest.repos.getContent({
      owner: repository.owner.login,
      repo: repository.name,
      path,
      ref
    });
    return Buffer.from((file as any).content, (file as any).encoding).toString('utf8');
  } catch (err: any) {
    // Try main branch if not found
    if (err.status === 404) {
      try {
        const { data: file } = await octokit.rest.repos.getContent({
          owner: repository.owner.login,
          repo: repository.name,
          path,
          ref: mainBranch
        });
        return Buffer.from((file as any).content, (file as any).encoding).toString('utf8');
      } catch (mainErr: any) {
        console.error(`Could not read ${path} from main branch:`, mainErr);
        return null;
      }
    } else {
      console.error(`Could not read ${path} from branch ${ref}:`, err);
      return null;
    }
  }
}
