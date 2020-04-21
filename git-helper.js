const del = require('del');
const path = require('path');
const util = require('util');
const {exec} = require('child_process');

const execPromise = util.promisify(exec);

const checkoutCommit = async (repoUrl, commitHash) => {
  const appDirPath = path.dirname(require.main.filename);
  const repoDirPath = path.resolve(appDirPath, 'repo');
  const repoPath = path.resolve(repoDirPath, commitHash);

  await del(repoDirPath);

  await execPromise(`git clone ${repoUrl} ${repoPath}`);

  await execPromise(`git checkout ${commitHash}`, {
    cwd: repoPath
  });

  return Promise.resolve(repoPath);
};

module.exports = {
  checkoutCommit,
};
