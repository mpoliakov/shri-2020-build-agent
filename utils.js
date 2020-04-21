const checkCommandForVulnerabilities = (command) => {
  if (!command.startsWith('npm') && !command.startsWith('yarn')) {
    return false;
  }

  if (command.indexOf(';') > -1) {
    return false;
  }

  return true;
};

module.exports = {
  checkCommandForVulnerabilities
};
