const express = require('express');
const axios = require('axios');

const del = require('del');
const util = require('util');
const {exec} = require('child_process');
const execPromise = util.promisify(exec);

const conf = require('./agent-conf');
const {checkoutCommit} = require('./git-helper');
const {checkCommandForVulnerabilities} = require('./utils');

const buildServerApi = axios.create({
  baseURL: `${conf.serverHost}:${conf.serverPort}`,
  timeout: 5000
});

const state = {
  isRegistered: undefined,
  currentBuild: null
};

const agent = express();
agent.use(express.json());

agent.post(`/build`, async (req, res) => {
  const {
    buildId,
    repoUrl,
    commitHash,
    buildCommand
  } = req.body;

  console.log(`Starting build process... Build: ${buildId}`);

  try {
    const repoPath = await checkoutCommit(repoUrl, commitHash);

    state.currentBuild = {
      buildId,
      buildCommand,
      repoPath
    };

    return res.status(200).json({
      buildId
    });
  } catch (err) {
    console.log(err.stderr);
    return res.status(400).send(err.stderr);
  }
});

agent.listen(conf.port, async () => {
  console.log(`Build agent is listening port ${conf.port}...`);

  await registerAgent();

  setTimeout(async function tick() {
    await registerAgent();
    setTimeout(tick, 5000);
  }, 5000);

  setTimeout(async function tick() {
    try {
      await processBuild();
    } catch (err) {
      console.log(`Error:`, err);
    }

    setTimeout(tick, 1000);
  }, 1000);
});

const registerAgent = async () => {
  try {
    await buildServerApi.post(`/notify-agent`, {
      host: `http://localhost`,
      port: conf.port
    });

    if (!state.isRegistered || state.isRegistered === undefined) {
      state.isRegistered = true;
      console.log(`Build agent was successfully registered.`);
    }
  } catch (e) {
    if (state.isRegistered || state.isRegistered === undefined) {
      state.isRegistered = false;
      console.log(`Build agent registration failed.`);
    }
  }
};

const processBuild = async () => {
  if (!state.isRegistered) {
    return;
  }

  const build = state.currentBuild;

  if (!build) {
    return;
  }

  const result = {
    buildId: build.buildId,
    status: `Fail`,
    stdout: null,
    stderr: null
  }

  if (checkCommandForVulnerabilities(build.buildCommand)) {
    try {
       const {stdout} = await execPromise(build.buildCommand, {
        cwd: build.repoPath
      });

      result.status = `Success`;
      result.stdout = stdout;
    } catch (err) {
      result.stderr = err.stdout;
    }
  } else {
    result.stderr = `Build command is unsafe.`;
  }

  try {
    await buildServerApi.post(`/notify-build-result`, result);
  } catch (err) {
    state.isRegistered = false;
    console.log(`Build server is not responding.`);
  } finally {
    await del(state.currentBuild.repoPath);
    state.currentBuild = null;
    console.log(`Finished build process. Build: ${build.buildId}`);
  }
};


