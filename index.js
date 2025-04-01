const express = require('express');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { createCanvas, registerFont } = require('canvas');
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

// Cache for rendered images
const imageCache = {};
const IMAGE_CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Location mapping cache
const locationCache = {};

// Main route for the Notion cover
app.get('/', async (req, res) => {
  try {
    const format = req.query.format || 'html';
    
    // Get quote data from Notion with fallback
    let quoteData;
    try {
      quoteData = await getRandomQuote();
    } catch (error) {
      console.error('Error fetching from Notion, using fallback quote:', error);
      quoteData = getFallbackQuote();
    }
    
    // Get coordinates for Konjic, Bosnia (default location)
    const coordinates = await getCoordinates('Konjic-ba');
    
    // Get weather data for Konjic, Bosnia
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
    
    if (format === 'image') {
      // Return as image
      const imageBuffer = await renderAsImage(data);
      res.contentType('image/png');
      res.send(imageBuffer);
    } else {
      // Read the template file
      const template = fs.readFileSync(path.join(__dirname, 'public', 'notion-cover-template.html'), 'utf8');
      
      // Replace placeholders with actual data
      const html = renderTemplate(template, data);
      
      // Return as HTML
      res.send(html);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});

// Image route for the Notion cover
app.get('/image', async (req, res) => {
  try {
    // Get quote data from Notion with fallback
    let quoteData;
    try {
      quoteData = await getRandomQuote();
    } catch (error) {
      console.error('Error fetching from Notion, using fallback quote:', error);
      quoteData = getFallbackQuote();
    }
    
    // Get coordinates for Konjic, Bosnia (default location)
    const coordinates = await getCoordinates('Konjic-ba');
    
    // Get weather data for Konjic, Bosnia
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
    
    // Return as image
    const imageBuffer = await renderAsImage(data);
    res.contentType('image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});

// Location-based route for the Notion cover
app.get('/cover/:location', async (req, res) => {
  try {
    const locationParam = req.params.location;
    const format = req.query.format || 'html';
    
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
    
    if (format === 'image') {
      // Return as image
      const imageBuffer = await renderAsImage(data);
      res.contentType('image/png');
      res.send(imageBuffer);
    } else {
      // Read the template file
      const template = fs.readFileSync(path.join(__dirname, 'public', 'notion-cover-template.html'), 'utf8');
      
      // Replace placeholders with actual data
      const html = renderTemplate(template, data);
      
      // Return as HTML
      res.send(html);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred: ' + error.message);
  }
});

// Location-based image route for the Notion cover
app.get('/image/:location', async (req, res) => {
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
    
    // Return as image
    const imageBuffer = await renderAsImage(data);
    res.contentType('image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred: ' + error.message);
  }
});

// Function to render data as image using canvas
async function renderAsImage(data) {
  const cacheKey = JSON.stringify(data);
  
  // Check if we have a cached image that's still valid
  if (imageCache[cacheKey] && imageCache[cacheKey].timestamp > Date.now() - IMAGE_CACHE_DURATION) {
    console.log('Using cached image');
    return imageCache[cacheKey].buffer;
  }
  
  console.log('Rendering new image...');
  
  try {
    // Create canvas with Notion cover dimensions
    const width = 1500;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw background gradient - match the original HTML design
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f5f7fa');
    gradient.addColorStop(1, '#e4e9f2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw date in top right
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(51, 51, 51, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(data.date, width - 30, 30);
    
    // Draw quote section (left side)
    const quoteSection = {
      x: 0,
      y: 0,
      width: width * 0.6,
      height: height
    };
    
    // Center quote in the quote section
    ctx.textAlign = 'left';
    
    // Draw quote
    const quoteX = quoteSection.x + 60;
    const quoteMaxWidth = quoteSection.width - 120;
    
    // Wrap quote text
    const quoteLines = wrapText(ctx, `"${data.quote}"`, quoteMaxWidth, 28);
    let quoteY = height / 2 - (quoteLines.length * 36) / 2;
    
    ctx.font = '300 28px Arial, sans-serif';
    ctx.fillStyle = '#333';
    quoteLines.forEach(line => {
      ctx.fillText(line, quoteX, quoteY);
      quoteY += 36;
    });
    
    // Draw author
    ctx.font = 'italic 14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(51, 51, 51, 0.7)';
    ctx.fillText(`— ${data.author}`, quoteX, quoteY + 20);
    
    // Draw weather section (right side)
    const weatherSectionX = width * 0.6;
    const weatherSectionWidth = width * 0.4;
    const weatherSectionHeight = height;
    
    // Draw weather section background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(weatherSectionX, 0, weatherSectionWidth, weatherSectionHeight);
    
    // Draw weather title and location
    ctx.font = '500 16px Arial, sans-serif';
    ctx.fillStyle = 'rgba(51, 51, 51, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText("Today's Weather", weatherSectionX + 30, 50);
    
    // Draw location if available
    if (data.location) {
      ctx.font = 'italic 14px Arial, sans-serif';
      ctx.fillStyle = 'rgba(51, 51, 51, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(data.location, weatherSectionX + weatherSectionWidth - 30, 50);
      ctx.textAlign = 'left';
    }
    
    // Draw weather grid
    const gridStartX = weatherSectionX + 30;
    const gridStartY = 80;
    const cellWidth = (weatherSectionWidth - 60) / 4;
    const cellHeight = 80;
    const cellPadding = 6;
    
    // Draw weather hours
    for (let i = 0; i < Math.min(data.weather.length, 8); i++) {
      const hour = data.weather[i];
      const row = Math.floor(i / 4);
      const col = i % 4;
      const cellX = gridStartX + col * cellWidth;
      const cellY = gridStartY + row * cellHeight;
      
      // Draw cell background with rounded corners
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      drawRoundedRect(
        ctx,
        cellX, 
        cellY, 
        cellWidth - cellPadding, 
        cellHeight - cellPadding,
        6 // border radius
      );
      
      // Draw time
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = 'rgba(51, 51, 51, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText(hour.displayTime, cellX + (cellWidth - cellPadding) / 2, cellY + 20);
      
      // Draw weather icon (emoji)
      ctx.font = '22px Arial';
      ctx.fillText(hour.icon, cellX + (cellWidth - cellPadding) / 2, cellY + 45);
      
      // Draw temperature
      ctx.font = '500 18px Arial, sans-serif';
      ctx.fillStyle = '#333';
      ctx.fillText(`${hour.temp}°`, cellX + (cellWidth - cellPadding) / 2, cellY + 70);
    }
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Cache the image
    imageCache[cacheKey] = {
      buffer: buffer,
      timestamp: Date.now()
    };
    
    return buffer;
  } catch (error) {
    console.error('Error rendering image:', error);
    throw error;
  }
}

// Helper function to draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// Helper function to wrap text
function wrapText(ctx, text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  ctx.font = `${fontSize}px Arial`;
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

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
async function getWeatherData(lat = 43.65, lon = 17.9667) {
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
  console.log(`For image format (for Notion cover), use: http://localhost:${PORT}/image`);
  console.log(`For location-based image, use: http://localhost:${PORT}/image/City-CountryCode`);
});
