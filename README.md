# COPA BR Dynamic Info

A Node.js program that fetches ([MCSR Ranked](https://mcsrranked.com/)) statistics and match information for two players and saves the data to text files. It is intended to be used with OBS Studio for dynamic tournament overlays.

## Features

- Fetches peak ELO, personal best (PB) time, wins, and losses for two players
- Retrieves the most recent match's splits (Nether, Bastion, Fortress, Blind Travel, Stronghold, End, Dragon Kill, Final Time) for each runner separately
- Saves information to easily readable text files which you can then add to your OBS Overlays

## Installation

### Prerequisites

- **Node.js** version 18 or higher ([Download Node.js](https://nodejs.org/))
- An internet connection

### Install Dependencies

If running with Node.js, install the required dependencies:

```bash
npm install
```

**Note:** The executable files (`.exe` and Linux binaries) are pre-built and don't require Node.js or npm installation.

## Configuration

Before running the program, configure the players you want to track in `config.json`:

1. Open `config.json` in a text editor
2. Edit the `runner1` and `runner2` fields with Minecraft usernames
3. Update `currentSeasonNumber` to match the current MCSR Ranked season (this is for fetching alltime information)

Example `config.json`:
```json
{
  "runner1": "boosterruns",
  "runner2": "sanjinhu",
  "currentSeasonNumber": 10,
  "decimalPrecision": 2,
  "showTimeLabels": true,
  "showInfoLabels": true
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `runner1` | string | - | Minecraft username of the first player (required) |
| `runner2` | string | - | Minecraft username of the second player (required) |
| `currentSeasonNumber` | number | - | Current MCSR Ranked season number (required for fetching all-time stats) |
| `decimalPrecision` | number | `3` | Number of decimal places for time display: `0` (MM:SS), `2` (MM:SS.cc), or `3` (MM:SS.mmm) |
| `showTimeLabels` | boolean | `true` | When `true`, match splits include labels (e.g., "NETHER: 02:15.12"). When `false`, only times are shown. |
| `showInfoLabels` | boolean | `true` | When `true`, player info includes labels (e.g., "Peak Elo (alltime): 1850"). When `false`, only values are shown. |

**Note:** Setting `showTimeLabels` and `showInfoLabels` to `false` is useful when you want to add custom labels in your OBS overlay.

## Running the Program

### Option 1: Using Node.js

After installing dependencies, run the program with:

```bash
npm start
```

or

```bash
npm run fetch
```

or directly with Node.js:

```bash
node index.js
```

### Option 2: Using the Executable

#### Windows

Double-click `dist/copabr-dynamic-info-win.exe` or run from command line:

```bash
dist\copabr-dynamic-info-win.exe
```

#### Linux

Make the file executable (first time only):

```bash
chmod +x dist/copabr-dynamic-info-linux
```

Then run:

```bash
./dist/copabr-dynamic-info-linux
```

**Note:** When using the executable, make sure `config.json` is in the same directory as the executable file, or it will use the bundled config.

## Output

The program creates four text files in the same directory as the executable (or current working directory when running with Node.js):

### `runner1_info.txt`
Contains statistics for the first player:
```
        Peak Elo (alltime): 1850
        Pb (alltime): 12:34.567
        Wins (season): 45
        Losses (season): 12
```

### `runner2_info.txt`
Contains statistics for the second player:
```
        Peak Elo (alltime): 1920
        Pb (alltime): 11:23.456
        Wins (season): 52
        Losses (season): 8
```

### `match_info_1.txt`
Contains match splits for runner 1 from the most recent match:
```
        NETHER: 02:15.123
        BASTION: 03:45.789
        FORTRESS: 05:12.345
        BLIND: 08:30.567
        STRONGHOLD: 12:45.890
        END: 15:20.456
        DRAGON KILL: 18:30.123
        FINAL TIME: 20:45.678
```

### `match_info_2.txt`
Contains match splits for runner 2 from the most recent match:
```
        NETHER: 02:18.456
        BASTION: 03:42.123
        FORTRESS: 05:08.901
        BLIND: 08:25.234
        STRONGHOLD: 12:40.123
        END: 15:15.789
        DRAGON KILL: 18:25.456
        FINAL TIME: -
```

**Note:** If a split is not available for a player, it will be displayed as `-`.

## How It Works

1. The program reads `config.json` to get the two player usernames
2. Fetches player statistics from the MCSR Ranked API across all seasons
3. Retrieves the most recent match ID for each player
4. Extracts match timeline splits and completion times
5. Formats and saves all information to text files

## Requirements

- Internet connection (fetches data from `mcsrranked.com` API)
- Valid Minecraft usernames in `config.json`
- Correct `currentSeasonNumber` in `config.json`

## Troubleshooting

- **"Config file must contain both runner1 and runner2"**: Make sure `config.json` has both fields filled
- **"failed to fetch"**: Check your internet connection and verify the Minecraft usernames are correct
- **Missing splits**: Some matches may not have all timeline events recorded, which will show as `-` in the output

## Building Executables

To build your own executables (requires `pkg`):

```bash
# Build for both Windows and Linux
npm run build

# Build for Windows only
npm run build:win

# Build for Linux only
npm run build:linux
```

Built executables will be placed in the `dist/` directory.
