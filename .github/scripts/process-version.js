const { execSync } = require('child_process');

function getLatestVersionTag(branch) {
  try {
    // If it's a hotfix branch, extract the base version
    let baseVersion = '';
    if (branch.startsWith('hotfix/')) {
      baseVersion = branch.split('hotfix/v')[1];
    }

    // Get all tags that match the pattern
    const tags = execSync('git tag --sort=-v:refname', { encoding: 'utf-8' })
      .split('\n')
      .filter(tag => tag.match(/^v\d+\.\d+\.\d+$/));

    if (baseVersion) {
      // For hotfix, find tags matching the base version
      const relevantTags = tags.filter(tag => tag.startsWith(`v${baseVersion}`));
      return relevantTags.length > 0 ? relevantTags[0] : `v${baseVersion}.0`;
    }

    // For main branch, return the latest tag
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