const { execSync } = require('child_process');

function getHotfixBaseVersion(branch) {
  try {
    // Get the commit where the branch was created
    const branchBase = execSync(`git merge-base origin/main ${branch}`, { encoding: 'utf-8' }).trim();
    
    // Get the latest tag that is reachable from this commit
    const baseTag = execSync(`git describe --tags --abbrev=0 ${branchBase}`, { encoding: 'utf-8' }).trim();
    
    console.log(`Branch ${branch} was created from tag: ${baseTag}`);
    return baseTag.substring(1); // Remove 'v' prefix
  } catch (error) {
    console.error('Error determining hotfix base version:', error);
    throw new Error(`Could not determine base version for hotfix branch: ${branch}`);
  }
}

function getLatestVersionTag(branch) {
  try {
    console.log(`Processing branch: ${branch}`);

    if (branch.startsWith('hotfix/')) {
      const baseVersion = getHotfixBaseVersion(branch);
      console.log(`Hotfix base version: ${baseVersion}`);

      // Get all tags sorted by version
      const allTags = execSync('git tag --sort=-v:refname', { encoding: 'utf-8' })
        .split('\n')
        .filter(tag => tag.match(/^v\d+\.\d+\.\d+$/));
      
      console.log('All available tags:', allTags);

      // Find tags that match the base version major.minor
      const [baseMajor, baseMinor] = baseVersion.split('.').map(Number);
      const matchingTags = allTags.filter(tag => {
        const version = tag.substring(1); // Remove 'v' prefix
        const [major, minor] = version.split('.').map(Number);
        return major === baseMajor && minor === baseMinor;
      });

      console.log('Matching tags for this hotfix:', matchingTags);

      // If matching tags exist, return the highest one, otherwise use the base version
      return matchingTags.length > 0 ? matchingTags[0] : `v${baseVersion}`;
    }

    // For main branch, get the latest tag
    const tags = execSync('git tag --sort=-v:refname', { encoding: 'utf-8' })
      .split('\n')
      .filter(tag => tag.match(/^v\d+\.\d+\.\d+$/));

    return tags.length > 0 ? tags[0] : 'v1.0.0';
  } catch (error) {
    console.error('Error getting latest version:', error.message);
    throw error;
  }
}

function incrementVersion(currentVersion, branch) {
  const version = currentVersion.replace('v', '');
  const [major, minor, patch] = version.split('.').map(Number);

  if (branch === 'main') {
    return `v${major}.${minor + 1}.0`;
  }

  // For hotfix branches, increment patch version
  const newVersion = `v${major}.${minor}.${patch + 1}`;
  console.log(`Incrementing version from ${currentVersion} to ${newVersion}`);
  return newVersion;
}

function main() {
  try {
    const branchName = process.env.BRANCH_NAME;
    if (!branchName) {
      throw new Error('BRANCH_NAME environment variable is not set');
    }

    console.log('Starting version processing...');
    console.log(`Branch name: ${branchName}`);

    const currentVersion = getLatestVersionTag(branchName);
    console.log(`Current version determined: ${currentVersion}`);

    const newVersion = incrementVersion(currentVersion, branchName);
    console.log(`New version calculated: ${newVersion}`);

    // Set output for GitHub Actions
    console.log(`::set-output name=new_version::${newVersion}`);
  } catch (error) {
    console.error('Error in version processing:', error.message);
    process.exit(1);
  }
}

main();