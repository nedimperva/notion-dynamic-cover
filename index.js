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
    // Create canvas with compact Notion cover dimensions
    const width = 1000;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw solid off-white background instead of gradient
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw accent circles with subtle gray
    ctx.beginPath();
    ctx.arc(40, 20, 60, 0, Math.PI * 2);
    const circleGradient1 = ctx.createRadialGradient(40, 20, 0, 40, 20, 60);
    circleGradient1.addColorStop(0, 'rgba(0,0,0,0.05)');
    circleGradient1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = circleGradient1;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width - 380, height - 30, 60, 0, Math.PI * 2);
    const circleGradient2 = ctx.createRadialGradient(width - 380, height - 30, 0, width - 380, height - 30, 60);
    circleGradient2.addColorStop(0, 'rgba(0,0,0,0.05)');
    circleGradient2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = circleGradient2;
    ctx.fill();
    
    // Draw divider between sections
    const dividerX = width * 0.6;
    ctx.beginPath();
    ctx.moveTo(dividerX, 0);
    ctx.lineTo(dividerX, height);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.stroke();
    
    // Draw quote section (left side)
    const quoteSection = {
      x: 0,
      y: 0,
      width: width * 0.6,
      height: height
    };
    
    // Center quote in the quote section
    ctx.textAlign = 'left';
    
    // Draw quote - moved more to the right with smaller font size
    const quoteX = quoteSection.x + 60;
    const quoteMaxWidth = quoteSection.width - 100;
    
    // Reduced font size from 22px to 20px
    ctx.font = '200 14px Arial, sans-serif';
    const quoteLines = wrapText(ctx, `"${data.quote}"`, quoteMaxWidth, 20);
    
    // Calculate the total height of the quote text
    const lineHeight = 26; // Reduced from 28 to 26
    const totalQuoteHeight = quoteLines.length * lineHeight;
    
    // Limit the number of lines to ensure it doesn't exceed the weather box height
    const maxLines = Math.min(quoteLines.length, 6); // Limit to 6 lines maximum
    const truncatedQuoteLines = quoteLines.slice(0, maxLines);
    
    // If we truncated, add ellipsis to the last line
    if (truncatedQuoteLines.length < quoteLines.length) {
      let lastLine = truncatedQuoteLines[truncatedQuoteLines.length - 1];
      // Trim the last line if needed to make room for ellipsis
      while (ctx.measureText(lastLine + '..."').width > quoteMaxWidth) {
        lastLine = lastLine.slice(0, -1);
      }
      truncatedQuoteLines[truncatedQuoteLines.length - 1] = lastLine + '...';
    }
    
    let quoteY = height / 2 - (truncatedQuoteLines.length * lineHeight) / 2;
    
    ctx.fillStyle = '#333333';
    truncatedQuoteLines.forEach(line => {
      ctx.fillText(line, quoteX, quoteY);
      quoteY += lineHeight;
    });
    
    // Add closing quote if we didn't truncate
    if (truncatedQuoteLines.length === quoteLines.length) {
      ctx.fillText('"', quoteX + ctx.measureText(truncatedQuoteLines[truncatedQuoteLines.length - 1]).width, quoteY - lineHeight);
    }
    
    // Draw author with smaller font
    ctx.font = 'italic 12px Arial, sans-serif'; // Reduced from 13px to 12px
    ctx.fillStyle = '#666666';
    ctx.fillText(`— ${data.author}`, quoteX, quoteY + 8); // Reduced spacing from 10 to 8
    
    // Draw weather section (right side)
    const weatherSection = {
      x: width * 0.6,
      y: 0,
      width: width * 0.4,
      height: height
    };
    
    // Fill weather section background with very light gray
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    ctx.fillRect(weatherSection.x, weatherSection.y, weatherSection.width, weatherSection.height);
    
    // Calculate vertical center of the weather section to align with quote
    const weatherContentHeight = 200; // Approximate height of weather content (title + 2x2 grid)
    const weatherStartY = (height - weatherContentHeight) / 2;
    
    // Format date to show day and month only
    const dateObj = new Date(data.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short'
    });
    
    // Draw location and date
    ctx.font = '500 14px Arial, sans-serif';
    ctx.fillStyle = '#444444';
    ctx.textAlign = 'left';
    ctx.fillText(data.location || 'Konjic', weatherSection.x + 20, weatherStartY);
    
    // Draw date next to location
    ctx.font = '400 14px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.fillText(formattedDate, weatherSection.x + weatherSection.width - 20, weatherStartY);
    ctx.textAlign = 'left';
    
    // Define the 4 time blocks for 2x2 grid
    const timeBlocks = [
      { label: '00:00 - 06:00', condition: 'night-clear', temp: '45' },
      { label: '06:00 - 12:00', condition: 'partly-cloudy', temp: '53' },
      { label: '12:00 - 18:00', condition: 'sunny', temp: '61' },
      { label: '18:00 - 00:00', condition: 'night-partly-cloudy', temp: '52' }
    ];
    
    // Process weather data if available
    let processedWeather = [...timeBlocks]; // Default to placeholder data
    
    if (data.weather && data.weather.length > 0) {
      // Simple mapping - in a real app you'd aggregate data more intelligently
      // This just takes the first entry for each time block if available
      const weatherMap = {};
      data.weather.forEach(item => {
        const hour = parseInt(item.time.split(' ')[0]);
        let blockIndex = 0;
        
        if (hour >= 0 && hour < 6) blockIndex = 0;
        else if (hour >= 6 && hour < 12) blockIndex = 1;
        else if (hour >= 12 && hour < 18) blockIndex = 2;
        else blockIndex = 3;
        
        if (!weatherMap[blockIndex]) {
          weatherMap[blockIndex] = {
            label: timeBlocks[blockIndex].label,
            condition: item.condition || item.icon,
            temp: item.temp
          };
        }
      });
      
      // Fill in any missing blocks with placeholder data
      for (let i = 0; i < 4; i++) {
        if (!weatherMap[i]) {
          weatherMap[i] = timeBlocks[i];
        }
      }
      
      processedWeather = [weatherMap[0], weatherMap[1], weatherMap[2], weatherMap[3]];
    }
    
    // Draw weather grid (2x2) - smaller size
    const gridStartX = weatherSection.x + 25; // Moved slightly right
    const gridStartY = weatherStartY + 30;
    const cellWidth = (weatherSection.width - 60) / 2; // Smaller cells, 2 columns with margins
    const cellHeight = 70; // Shorter cells for the 2x2 grid
    
    for (let i = 0; i < 4; i++) {
      const weather = processedWeather[i];
      const row = Math.floor(i / 2);
      const col = i % 2;
      
      const cellX = gridStartX + col * (cellWidth + 10); // 10px gap between cells
      const cellY = gridStartY + row * (cellHeight + 10); // 10px gap between rows
      
      // Draw cell background (white box with shadow)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 6; // Reduced shadow blur
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      roundRect(ctx, cellX, cellY, cellWidth, cellHeight, 6, true); // Smaller corner radius
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw time period - smaller text
      ctx.font = '10px Arial, sans-serif'; // Reduced from 11px to 10px
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.fillText(weather.label, cellX + cellWidth/2, cellY + 16); // Moved up slightly
      
      // Draw weather icon with color (no background circle)
      const weatherIcon = getWeatherIcon(weather.condition);
      const iconColor = getWeatherIconColor(weather.condition);
      
      // Draw colored weather icon directly
      ctx.font = '22px sans-serif'; // Changed from Arial to sans-serif for better emoji support
      ctx.fillStyle = iconColor; // Colored icon
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(weatherIcon, cellX + cellWidth/2, cellY + 38); // Moved up slightly
      ctx.textBaseline = 'alphabetic'; // Reset to default
      
      // Generate min/max temperature range
      // If we have actual min/max data, use it; otherwise, generate fake range
      const tempValue = parseInt(weather.temp) || 0;
      const minTemp = weather.minTemp || (tempValue - Math.floor(Math.random() * 4 + 2));
      const maxTemp = weather.maxTemp || (tempValue + Math.floor(Math.random() * 4 + 2));
      
      // Draw temperature range - smaller text
      ctx.font = '400 10px Arial, sans-serif'; // Reduced from 12px to 10px
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.fillText(`${minTemp}° - ${maxTemp}°`, cellX + cellWidth/2, cellY + 58); // Moved up slightly
    }
    
    // Convert canvas to buffer and cache it
    const buffer = canvas.toBuffer('image/png');
    imageCache[cacheKey] = {
      buffer,
      timestamp: Date.now()
    };
    
    return buffer;
  } catch (error) {
    console.error('Error rendering image:', error);
    throw error;
  }
}

// Helper function to convert weather condition to text representation
function getWeatherIcon(condition) {
  const iconMap = {
    'sunny': '☀',
    'clear': '☀',
    'partly-cloudy': '⛅',
    'cloudy': '☁',
    'overcast': '☁',
    'rain': '🌧',
    'showers': '🌦',
    'thunderstorm': '⛈',
    'snow': '❄',
    'fog': '🌫',
    'night-clear': '🌙',
    'night-partly-cloudy': '🌙',
    'night-cloudy': '☁'
  };
  
  // If condition is already an emoji, return it
  if (condition && condition.length <= 2) {
    return condition;
  }
  
  // Return the mapped icon or a default one
  return iconMap[condition] || '☀';
}

// Helper function to get color for weather icon
function getWeatherIconColor(condition) {
  const colorMap = {
    'sunny': '#FF9500',        // Orange
    'clear': '#FF9500',        // Orange
    'partly-cloudy': '#87CEEB', // Sky Blue
    'cloudy': '#6c757d',       // Gray
    'overcast': '#495057',     // Dark Gray
    'rain': '#0D6EFD',         // Blue
    'showers': '#0DCAF0',      // Light Blue
    'thunderstorm': '#6610F2', // Purple
    'snow': '#ADB5BD',         // Light Gray
    'fog': '#CED4DA',          // Very Light Gray
    'night-clear': '#343A40',  // Dark Blue-Gray
    'night-partly-cloudy': '#495057', // Dark Gray
    'night-cloudy': '#343A40'  // Dark Blue-Gray
  };
  
  return colorMap[condition] || '#FF9500'; // Default to orange
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
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

// Add a cache reset endpoint
app.get('/reset-cache', (req, res) => {
  // Clear the image cache
  imageCache = {};
  console.log('Image cache has been reset');
  res.send('Image cache has been reset successfully');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`For location-based weather, use: http://localhost:${PORT}/cover/City-CountryCode`);
  console.log(`Example: http://localhost:${PORT}/cover/Konjic-ba for Konjic, Bosnia`);
  console.log(`For image format (for Notion cover), use: http://localhost:${PORT}/image`);
  console.log(`For location-based image, use: http://localhost:${PORT}/image/City-CountryCode`);
});
