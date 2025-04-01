const express = require('express');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Add dotenv to properly load environment variables
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Notion client
const notion = new Client({ 
  auth: process.env.NOTION_API_KEY 
});

// Your Notion database ID
const databaseId = process.env.NOTION_DATABASE_ID;

// Log environment variables for debugging (without showing full values for security)
console.log(`NOTION_API_KEY: ${process.env.NOTION_API_KEY ? '***' + process.env.NOTION_API_KEY.slice(-4) : 'not set'}`);
console.log(`NOTION_DATABASE_ID: ${process.env.NOTION_DATABASE_ID ? '***' + process.env.NOTION_DATABASE_ID.slice(-4) : 'not set'}`);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Location mapping cache
const locationCache = {};

// Main route for the Notion cover
app.get('/', async (req, res) => {
  try {
    // Get quote data from Notion with fallback
    let quoteData;
    try {
      quoteData = await getRandomQuote();
    } catch (error) {
      console.error('Error fetching from Notion, using fallback quote:', error);
      quoteData = getFallbackQuote();
    }
    
    // Get weather data from yr.no (default location)
    const weatherData = await getWeatherData();
    
    // Combine data and render the page
    const data = {
      quote: quoteData.quote,
      author: quoteData.author,
      category: quoteData.category,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      weather: weatherData,
      location: "Default Location"
    };
    
    // Read the template file
    const template = fs.readFileSync(path.join(__dirname, 'public', 'notion-cover-template.html'), 'utf8');
    
    // Replace placeholders with actual data
    const html = renderTemplate(template, data);
    
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});

// Location-based route for the Notion cover
app.get('/cover/:location', async (req, res) => {
  try {
    const locationParam = req.params.location;
    
    // Get quote data from Notion with fallback
    let quoteData;
    try {
      quoteData = await getRandomQuote();
    } catch (error) {
      console.error('Error fetching from Notion, using fallback quote:', error);
      quoteData = getFallbackQuote();
    }
    
    // Get coordinates for the location
    const coordinates = await getCoordinates(locationParam);
    
    // Get weather data from yr.no for the specific location
    const weatherData = await getWeatherData(coordinates.lat, coordinates.lon);
    
    // Combine data and render the page
    const data = {
      quote: quoteData.quote,
      author: quoteData.author,
      category: quoteData.category,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      weather: weatherData,
      location: coordinates.displayName
    };
    
    // Read the template file
    const template = fs.readFileSync(path.join(__dirname, 'public', 'notion-cover-template.html'), 'utf8');
    
    // Replace placeholders with actual data
    const html = renderTemplate(template, data);
    
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred: ' + error.message);
  }
});

// Function to get coordinates from location string
async function getCoordinates(locationString) {
  // Check if we have this location cached
  if (locationCache[locationString]) {
    return locationCache[locationString];
  }
  
  try {
    // Parse location string (format: City-CountryCode, e.g., Konjic-ba)
    const parts = locationString.split('-');
    const city = parts[0];
    const countryCode = parts.length > 1 ? parts[1] : '';
    
    // Use Nominatim API to get coordinates
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: countryCode ? `${city}, ${countryCode}` : city,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'notion-dynamic-cover/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
        displayName: response.data[0].display_name.split(',')[0]  // Just the city name
      };
      
      // Cache the result
      locationCache[locationString] = result;
      
      return result;
    } else {
      throw new Error(`Location not found: ${locationString}`);
    }
  } catch (error) {
    console.error('Error getting coordinates:', error);
    throw new Error(`Could not find coordinates for ${locationString}`);
  }
}

// Function to get a random quote from Notion database
async function getRandomQuote() {
  try {
    console.log(`Attempting to query Notion database: ${databaseId}`);
    
    // Query the Notion database
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100, // Adjust based on your database size
    });
    
    console.log(`Successfully queried Notion database. Found ${response.results.length} quotes.`);
    
    // If no results, return default quote
    if (!response.results || response.results.length === 0) {
      console.log('No quotes found in the database.');
      return {
        quote: "No quotes found in your Notion database",
        author: "System",
        category: "Error"
      };
    }
    
    // Log the structure of the first page to help debug
    if (response.results.length > 0) {
      console.log('First page structure example:', JSON.stringify(response.results[0].properties, null, 2));
    }
    
    // Get all quotes
    const quotes = response.results.map(page => {
      // Check if properties exist and have expected structure
      const hasName = page.properties.Name && 
                      page.properties.Name.title && 
                      page.properties.Name.title.length > 0;
                      
      const hasAuthor = page.properties.Author && 
                        page.properties.Author.rich_text && 
                        page.properties.Author.rich_text.length > 0;
                        
      const hasCategory = page.properties.Category && 
                          page.properties.Category.select;
      
      return {
        quote: hasName ? page.properties.Name.title[0].plain_text : "No quote available",
        author: hasAuthor ? page.properties.Author.rich_text[0].plain_text : "Unknown",
        category: hasCategory ? page.properties.Category.select.name : "Uncategorized"
      };
    });
    
    // Return a random quote
    return quotes[Math.floor(Math.random() * quotes.length)];
  } catch (error) {
    console.error('Error fetching from Notion:', error);
    
    // Provide more detailed error information
    if (error.code === 'unauthorized') {
      console.log('Notion API authentication failed. Please check your API key.');
    } else if (error.code === 'object_not_found') {
      console.log('Notion database not found. Please check your database ID.');
    }
    
    return {
      quote: "Error fetching quote from Notion",
      author: "System",
      category: "Error"
    };
  }
}

// Function to get weather data from yr.no
async function getWeatherData(lat = 59.9139, lon = 10.7522) {
  try {
    // Get weather data from yr.no API
    const response = await axios.get('https://api.met.no/weatherapi/locationforecast/2.0/compact', {
      params: {
        lat: lat,
        lon: lon
      },
      headers: {
        'User-Agent': 'notion-dynamic-cover/1.0 github.com/your-username/notion-dynamic-cover'
      }
    });
    
    // Process the weather data
    const forecastData = response.data.properties.timeseries;
    const weatherHours = [];
    
    // Get current hour
    const currentHour = new Date().getHours();
    
    // Create 8 forecast points (every 3 hours)
    for (let i = 0; i < 8; i++) {
      const hourOffset = i * 3;
      const forecastHour = (currentHour + hourOffset) % 24;
      
      // Find the closest forecast time
      const closestForecast = forecastData.find(item => {
        const itemDate = new Date(item.time);
        return itemDate.getHours() === forecastHour;
      }) || forecastData[i];
      
      if (closestForecast) {
        const itemDate = new Date(closestForecast.time);
        const temperature = Math.round(closestForecast.data.instant.details.air_temperature);
        const symbolCode = closestForecast.data.next_1_hours?.summary?.symbol_code || 
                          closestForecast.data.next_6_hours?.summary?.symbol_code || 
                          'cloudy';
        
        weatherHours.push({
          time: itemDate.getHours() + ':00',
          displayTime: formatDisplayTime(itemDate.getHours()),
          temp: temperature,
          icon: getWeatherEmoji(symbolCode)
        });
      }
    }
    
    return weatherHours;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Return placeholder data in case of error
    const weatherHours = [];
    const currentHour = new Date().getHours();
    
    for (let i = 0; i < 8; i++) {
      const hourOffset = i * 3;
      const forecastHour = (currentHour + hourOffset) % 24;
      
      weatherHours.push({
        time: forecastHour + ':00',
        displayTime: formatDisplayTime(forecastHour),
        temp: '--',
        icon: '❓'
      });
    }
    
    return weatherHours;
  }
}

// Format display time (e.g., "3 PM", "12 AM")
function formatDisplayTime(hour) {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

// Map weather codes to emojis
function getWeatherEmoji(symbolCode) {
  const weatherMap = {
    'clearsky': '☀️',
    'fair': '🌤️',
    'partlycloudy': '⛅',
    'cloudy': '☁️',
    'rainshowers': '🌦️',
    'rainshowersandthunder': '⛈️',
    'sleetshowers': '🌨️',
    'snowshowers': '❄️',
    'rain': '🌧️',
    'heavyrain': '🌧️',
    'heavyrainandthunder': '⛈️',
    'sleet': '🌨️',
    'snow': '❄️',
    'snowandthunder': '⛈️',
    'fog': '🌫️',
    'sleetshowersandthunder': '⛈️',
    'snowshowersandthunder': '⛈️',
    'rainandthunder': '⛈️',
    'sleetandthunder': '⛈️'
  };
  
  // Handle day/night variations
  const baseCode = symbolCode.split('_')[0];
  
  return weatherMap[baseCode] || '🌈';
}

// Function to get a fallback quote when Notion API fails
function getFallbackQuote() {
  const fallbackQuotes = [
    {
      quote: "The best way to predict the future is to create it.",
      author: "Abraham Lincoln",
      category: "Inspiration"
    },
    {
      quote: "Simplicity is the ultimate sophistication.",
      author: "Leonardo da Vinci",
      category: "Design"
    },
    {
      quote: "Life is what happens when you're busy making other plans.",
      author: "John Lennon",
      category: "Life"
    },
    {
      quote: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "Work"
    },
    {
      quote: "In the middle of difficulty lies opportunity.",
      author: "Albert Einstein",
      category: "Motivation"
    }
  ];
  
  return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
}

// Simple template rendering function
function renderTemplate(template, data) {
  let html = template;
  
  // Replace date
  html = html.replace('{{date}}', data.date);
  
  // Replace quote
  html = html.replace('{{quote}}', data.quote);
  html = html.replace('{{author}}', data.author);
  
  // Replace location if available
  if (data.location) {
    html = html.replace('{{location}}', data.location);
  } else {
    html = html.replace('{{location}}', '');
  }
  
  // Replace weather data
  let weatherHtml = '';
  data.weather.forEach(hour => {
    weatherHtml += `
      <div class="weather-hour">
        <div class="time">${hour.displayTime}</div>
        <div class="icon">${hour.icon}</div>
        <div class="temp">${hour.temp}°</div>
      </div>
    `;
  });
  
  html = html.replace('{{weather}}', weatherHtml);
  
  return html;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`For location-based weather, use: http://localhost:${PORT}/cover/City-CountryCode`);
  console.log(`Example: http://localhost:${PORT}/cover/Konjic-ba for Konjic, Bosnia`);
});
