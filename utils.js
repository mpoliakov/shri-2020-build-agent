const checkCommandForVulnerabilities = (command) => {
  // TODO: check command for vulnerabilities

  if (command.indexOf(';') > -1) {
    return false;
  }

  return true;
};

module.exports = {
  checkCommandForVulnerabilities
};
