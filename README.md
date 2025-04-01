# Notion Dynamic Cover

A dynamic cover image generator for Notion that displays random quotes from your Notion database along with current weather data from yr.no.

## Features

- Pulls quotes from your Notion "quotes" database
- Displays quote, author, and category
- Shows current weather forecast from yr.no
- Automatically refreshes data when the page is reloaded
- Supports location-based weather data through URL parameters

## Setup

### Prerequisites

- Node.js (v14 or higher)
- A Notion integration with API access
- A Notion database with quotes (containing Name, Author, and Category properties)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/your-username/notion-dynamic-cover.git
   cd notion-dynamic-cover
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   NOTION_API_KEY=your_notion_api_key
   NOTION_DATABASE_ID=your_notion_database_id
   PORT=3000
   ```

### Notion API Setup

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations) to create a new integration
2. Copy the API key and add it to your `.env` file
3. Share your quotes database with the integration
4. Copy the database ID from the URL (the part after the workspace name and before the question mark) and add it to your `.env` file

### Running the Application

Start the server:
```
npm start
```

The dynamic cover will be available at `http://localhost:3000`

## Usage in Notion

1. Open your Notion page
2. Change the cover image
3. Select "Link" and enter one of the following URLs:
   - `http://localhost:3000` - Uses default weather location
   - `http://localhost:3000/cover/City-CountryCode` - Uses weather for the specified location
     - Example: `http://localhost:3000/cover/Konjic-ba` for Konjic, Bosnia
     - Format: City name followed by country code, separated by a hyphen
4. The cover will update with a new quote and weather data whenever the page is refreshed

## Customization

- Edit `public/notion-cover-template.html` to change the design
- Default weather location can be modified in `index.js` by changing the default latitude and longitude values in the `getWeatherData()` function

## License

MIT
