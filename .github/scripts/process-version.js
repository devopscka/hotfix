const { execSync } = require('child_process');

function getLatestVersionTag(branch) {
  try {
    // For hotfix branches, extract the base version from branch name
    // Example: hotfix/v1.1.0 -> 1.1.0
    if (branch.startsWith('hotfix/')) {
      const baseVersion = branch.split('hotfix/v')[1];
      if (!baseVersion) {
        throw new Error('Invalid hotfix branch name format. Expected: hotfix/v{major}.{minor}.{patch}');
      }

      // Get all tags that match this specific base version
      const tags = execSync('git tag --sort=-v:refname', { encoding: 'utf-8' })
        .split('\n')
        .filter(tag => tag.match(/^v\d+\.\d+\.\d+$/))
        .filter(tag => {
          const tagVersion = tag.substring(1); // Remove 'v' prefix
          return tagVersion.startsWith(baseVersion);
        });

      // If no tags exist for this base version, use the base version itself
      return tags.length > 0 ? tags[0] : `v${baseVersion}`;
    }

    // For main branch, get the latest tag
    const tags = execSync('git tag --sort=-v:refname', { encoding: 'utf-8' })
      .split('\n')
      .filter(tag => tag.match(/^v\d+\.\d+\.\d+$/));

    return tags.length > 0 ? tags[0] : 'v1.0.0';
  } catch (error) {
    console.error('Error getting latest version:', error);
    return 'v1.0.0';
  }
}

function incrementVersion(currentVersion, branch) {
  const version = currentVersion.replace('v', '');
  const [major, minor, patch] = version.split('.').map(Number);

  if (branch === 'main') {
    return `v${major}.${minor + 1}.0`;
  }

  // For hotfix branches, increment patch version
  return `v${major}.${minor}.${patch + 1}`;
}

function main() {
  const branchName = process.env.BRANCH_NAME;
  const currentVersion = getLatestVersionTag(branchName);
  const newVersion = incrementVersion(currentVersion, branchName);

  // Set output for GitHub Actions
  console.log(`::set-output name=new_version::${newVersion}`);
  console.log(`Processing version for branch: ${branchName}`);
  console.log(`Current version: ${currentVersion}`);
  console.log(`New version: ${newVersion}`);
}

main();