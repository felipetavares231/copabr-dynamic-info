#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');


async function getConfig() {
  const configPath = path.join(__dirname, 'config.json');
  const configData = await fs.readFile(configPath, 'utf8');
  const config = JSON.parse(configData);

  return config;
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

async function fetchMatchInfo(runnerName) {

}

async function fetchRunnerInfo(runnerName) {
  const searchQuery = encodeURIComponent(runnerName);

  let config = await getConfig();
  let currentSeasonNumber = config.currentSeasonNumber;
  let peakElo = 0;
  let pb = 0;
  let wins = 0;
  let losses = 0;

  for (let i = 1; i <= currentSeasonNumber; i++) {
    const apiUrl = `https://mcsrranked.com/api/users/${runnerName}?season=${i}`;
    const response = await fetch(apiUrl);

    if (!response.status) {
      throw new Error('error, no status given')
    }

    const data = await response.json();
    const eloSeason = data?.data?.seasonResult?.highest
    const pbSeason = data?.data?.statistics?.total?.bestTime?.ranked


    if (eloSeason > peakElo) {
      peakElo = eloSeason
    }

    if (pbSeason !== undefined) {
      pb = pbSeason
    }

    if (i + 1 > currentSeasonNumber) {
      wins = data?.data?.statistics?.season?.wins?.ranked
      losses = data?.data?.statistics?.season?.loses?.ranked
    }
  }

  return {
    peakElo,
    pb: formatTime(pb),
    wins,
    losses
  }
}

// Function to save information to a text file
async function saveToFile(runnerName, content) {
  const fileName = `${runnerName}_info.txt`;
  const filePath = path.join(__dirname, fileName);

  await fs.writeFile(filePath, content, 'utf8');
  console.log(`✓ Saved information for ${runnerName} to ${fileName}`);

  return filePath;
}

// Main function
async function main() {
  try {
    console.log('Starting runner information fetcher...\n');

    const config = await getConfig();

    // Validate config
    if (!config.runner1 || !config.runner2) {
      throw new Error('Config file must contain both runner1 and runner2');
    }

    console.log(`Found runners: ${config.runner1} and ${config.runner2}\n`);

    // Fetch information for both runners
    console.log('Fetching information...\n');

    const [info1, info2] = await Promise.all([
      fetchRunnerInfo(config.runner1),
      fetchRunnerInfo(config.runner2)
    ]);

    // Save information to files
    await Promise.all([
      saveToFile(
        "runner1",
        `
        ${info1.peakElo}
        ${info1.pb}
        ${info1.wins}
        ${info1.losses}
        `
      ),
      saveToFile(
        "runner2",
        `
        ${info2.peakElo}
        ${info2.pb}
        ${info2.wins}
        ${info2.losses}
        `
      ),
    ]);

    console.log('\n✓ All information fetched and saved successfully!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
