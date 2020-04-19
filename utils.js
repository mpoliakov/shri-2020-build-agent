const checkBuildCommand = (command) => {
  if (!command.startsWith('npm')) {
    return false;
  }

  if (command.indexOf(';') > -1) {
    return false;
  }

  return true;
};

module.exports = {
  checkBuildCommand
};
