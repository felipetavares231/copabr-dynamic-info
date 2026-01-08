#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { kill } = require('process');
const { format } = require('url');


async function getConfig() {
  // Try to read config.json in this order:
  // 1. Current working directory (for overrides)
  // 2. Executable directory (when packaged)
  // 3. Bundled config.json (fallback)
  let configPath = path.join(process.cwd(), 'config.json');
  try {
    await fs.access(configPath);
  } catch {
    // Try executable directory
    if (process.pkg) {
      configPath = path.join(path.dirname(process.execPath), 'config.json');
      try {
        await fs.access(configPath);
      } catch {
        // Fall back to bundled config
        configPath = path.join(__dirname, 'config.json');
      }
    } else {
      // Fall back to bundled config
      configPath = path.join(__dirname, 'config.json');
    }
  }
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

async function getMinecraftId(playerName) {
  const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${playerName}`)
  if (!res.ok) {
    throw new Error("failed to fetch")
  }
  let data = await res.json();
  return data.id;
}

const runnerNameToIdMap = async () => {
  const config = await getConfig();
  const runner1Id = await getMinecraftId(config.runner1)
  const runner2Id = await getMinecraftId(config.runner2)
  return {
    [config.runner1]: runner1Id,
    [config.runner2]: runner2Id
  }
}

async function fetchMatchInfo(runner1, runner2) {
  const config = await getConfig();

  const getRecentMatchId = async (runnerName) => {
    const apiUrl = `https://mcsrranked.com/api/users/${runnerName}/matches?type=3`
    const response = await fetch(apiUrl);
    const data = await response.json();

    const matchId = data?.data[0]?.id
    return matchId;
  }

  const getRecentMatchInfo = async (runnerName) => {
    const runnerNameToId = await runnerNameToIdMap()

    const matchId = await getRecentMatchId(runnerName);
    const apiUrl = `https://mcsrranked.com/api/matches/${matchId}`
    const response = await fetch(apiUrl);
    const data = await response.json();

    const enterNether = data?.data?.timelines?.filter(timeline => timeline.type == "story.enter_the_nether")?.filter(timeline => timeline.uuid == runnerNameToId[runnerName])[0]?.time

    const enterBastion = data?.data?.timelines?.filter(timeline => timeline.type == "nether.find_bastion")?.filter(timeline => timeline.uuid == runnerNameToId[runnerName])[0]?.time

    const enterFortress = data?.data?.timelines?.filter(timeline => timeline.type == "nether.find_fortress")?.filter(timeline => timeline.uuid == runnerNameToId[runnerName])[0]?.time

    const blindTravel = data?.data?.timelines?.filter(timeline => timeline.type == "projectelo.timeline.blind_travel")?.filter(timeline => timeline.uuid == runnerNameToId[runnerName])[0]?.time

    const enterStronghold = data?.data?.timelines?.filter(timeline => timeline.type == "story.follow_ender_eye")?.filter(timeline => timeline.uuid == runnerNameToId[runnerName])[0]?.time

    const enterEnd = data?.data?.timelines?.filter(timeline => timeline.type == "story.enter_the_end")?.filter(timeline => timeline.uuid == runnerNameToId[runnerName])[0]?.time

    const killDragon = data?.data?.timelines?.filter(timeline => timeline.type == "projectelo.timeline.dragon_death")?.filter(timeline => timeline.uuid == runnerNameToId[runnerName])[0]?.time

    const finalTime = data?.data?.completions[0]?.time

    const formatTimeOrDash = (time) => {
      if (time === undefined || time === null || isNaN(time)) {
        return '-';
      }
      const formatted = formatTime(time);
      return formatted.includes('NaN') ? '-' : formatted;
    };

    return {
      enterNether: formatTimeOrDash(enterNether),
      enterBastion: formatTimeOrDash(enterBastion),
      enterFortress: formatTimeOrDash(enterFortress),
      blindTravel: formatTimeOrDash(blindTravel),
      enterStronghold: formatTimeOrDash(enterStronghold),
      enterEnd: formatTimeOrDash(enterEnd),
      killDragon: formatTimeOrDash(killDragon),
      finalTime: data?.data?.completions[0]?.uuid == runnerNameToId[runnerName] ? formatTimeOrDash(finalTime) : '-'
    }
  }

  const splitsRunner1 = await getRecentMatchInfo(config.runner1)
  const splitsRunner2 = await getRecentMatchInfo(config.runner2)

  return {
    runner1: splitsRunner1,
    runner2: splitsRunner2
  }
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

// Function to get the directory where the executable is located
function getExecutableDir() {
  // When packaged with pkg, use the directory of the executable
  // Otherwise, use __dirname for development
  if (process.pkg) {
    return path.dirname(process.execPath);
  }
  return __dirname;
}

// Function to save information to a text file
async function saveToFile(runnerName, content) {
  const fileName = `${runnerName}_info.txt`;
  const filePath = path.join(getExecutableDir(), fileName);

  await fs.writeFile(filePath, content, 'utf8');
  console.log(`✓ Saved information for ${runnerName} to ${filePath}`);

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

    const [info1, info2, matchInfo] = await Promise.all([
      fetchRunnerInfo(config.runner1),
      fetchRunnerInfo(config.runner2),
      fetchMatchInfo(config.runner1, config.runner2)
    ]);

    // Save information to files
    await Promise.all([
      saveToFile(
        "runner1",
        `
        Peak Elo (alltime): ${info1.peakElo}
        Pb (alltime): ${info1.pb}
        Wins (season): ${info1.wins}
        Losses (season): ${info1.losses}
        `
      ),
      saveToFile(
        "runner2",
        `
        Peak Elo (alltime): ${info2.peakElo}
        Pb (alltime): ${info2.pb}
        Wins (season): ${info2.wins}
        Losses (season): ${info2.losses}
        `
      ),
      saveToFile(
        "match_info_1",
        `
        NETHER: ${matchInfo.runner1.enterNether}
        BASTION: ${matchInfo.runner1.enterBastion}
        FORTRESS: ${matchInfo.runner1.enterFortress}
        BLIND: ${matchInfo.runner1.blindTravel}
        STRONGHOLD: ${matchInfo.runner1.enterStronghold}
        END: ${matchInfo.runner1.enterEnd}
        DRAGON KILL: ${matchInfo.runner1.killDragon}
        FINAL TIME: ${matchInfo.runner1.finalTime}
        `
      ),
      saveToFile(
        "match_info_2",
        `
        NETHER: ${matchInfo.runner2.enterNether}
        BASTION: ${matchInfo.runner2.enterBastion}
        FORTRESS: ${matchInfo.runner2.enterFortress}
        BLIND: ${matchInfo.runner2.blindTravel}
        STRONGHOLD: ${matchInfo.runner2.enterStronghold}
        END: ${matchInfo.runner2.enterEnd}
        DRAGON KILL: ${matchInfo.runner2.killDragon}
        FINAL TIME: ${matchInfo.runner2.finalTime}
        `
      )
    ]);

    console.log('\n✓ All information fetched and saved successfully!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
