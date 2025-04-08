# Notion Dynamic Cover

A dynamic cover image generator for Notion that displays random quotes from your Notion database.

## Features

- Pulls quotes from your Notion "quotes" database
- Displays quote and author
- Automatically refreshes quote when the page is reloaded

## Setup

### Prerequisites

- Node.js (v14 or higher)
- A Notion integration with API access
- A Notion database with quotes (containing Name and Author properties)

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

npm start

The dynamic cover will be available at `http://localhost:3000`

## Usage in Notion

1. Open your Notion page
2. Change the cover image
3. Select "Link" and enter one of the following URLs:
   - `http://localhost:3000/image` - For image format (recommended for Notion)
   - `http://localhost:3000` - For HTML format (for viewing in browser)
4. The cover will update with a new quote whenever the page is refreshed

## Customization

- Edit `public/notion-cover-template.html` to change the design

## License

MIT