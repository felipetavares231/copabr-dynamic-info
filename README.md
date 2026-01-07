# Runner Information Fetcher

A simple JavaScript program that fetches information about runners from the internet and saves it to text files.

## Setup

1. Make sure you have Node.js installed (version 18 or higher)

2. Install dependencies (if needed):
   ```bash
   npm install
   ```

## Configuration

1. Open `config.json` in a text editor
2. Edit the `runner1` and `runner2` fields with the names of the runners you want information about

Example:
```json
{
  "runner1": "Eliud Kipchoge",
  "runner2": "Usain Bolt"
}
```

## Usage

### Option 1: Using npm script
```bash
npm start
```
or
```bash
npm run fetch
```

### Option 2: Make it executable and run directly
```bash
chmod +x index.js
./index.js
```

### Option 3: Run with Node.js
```bash
node index.js
```

## Output

The program will create two text files:
- `Runner1_Name_info.txt` - Contains information about runner1
- `Runner2_Name_info.txt` - Contains information about runner2

Each file contains:
- Runner name
- Description
- Source URL
- Timestamp of when the information was fetched

## Notes

- The program uses the Wikipedia API to fetch information
- If the API fails, it will still create the files with error information
- Make sure you have an internet connection when running the program
