# Weather Functionality Setup

This document explains how to set up and use the weather functionality in the DeepSeek AI application.

## Overview

The weather functionality allows users to get real-time weather information for any location using the OpenWeatherMap API, enhanced with Google's AI for natural language responses.

## Features

- **Real-time Weather Data**: Get current weather conditions for any location
- **AI-Enhanced Responses**: Google AI provides natural language weather summaries
- **Rich Weather Information**: Temperature, humidity, wind speed, weather conditions
- **Beautiful UI**: Modern weather display component with icons and gradients
- **Integration**: Seamlessly integrated with the chat interface

## Setup Instructions

### 1. Get OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/)
2. Sign up for a free account
3. Navigate to your API keys section
4. Copy your API key

### 2. Configure Environment Variables

Add the following to your `.env` file in the server directory:

```env
# Weather API Configuration
OPENWEATHER_API_KEY=your-openweather-api-key-here
```

### 3. API Endpoints

The weather functionality provides two endpoints:

#### Weather with AI Processing
- **URL**: `POST /api/weather/with-ai`
- **Body**: 
  ```json
  {
    "location": "London, UK",
    "userQuestion": "What's the weather like?"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "weather": "Clouds",
      "temperature": 18,
      "location": "London",
      "humidity": 75,
      "windSpeed": 3.2,
      "description": "scattered clouds",
      "aiResponse": "It's currently 18°C in London with scattered clouds. The humidity is 75% and there's a light breeze at 3.2 m/s. It's a pleasant day for outdoor activities!",
      "retrievedAt": "2024-01-15T10:30:00.000Z"
    }
  }
  ```

#### Weather Data Only
- **URL**: `POST /api/weather/data`
- **Body**: 
  ```json
  {
    "location": "New York, US"
  }
  ```
- **Response**: Raw weather data without AI processing

### 4. Client-Side Usage

#### Enable Weather Mode
1. Click the tools button in the chat interface
2. Select "Weather" from the tools menu
3. Enter a location (e.g., "London", "New York", "Tokyo")
4. Press Enter to get weather information

#### Weather Component
The weather information is displayed using the `Weather` component:

```tsx
import Weather from '@/components/weather/Weather';

<Weather 
  temperature={18}
  weather="Clouds"
  location="London"
  humidity={75}
  windSpeed={3.2}
  description="scattered clouds"
  aiResponse="It's currently 18°C in London..."
/>
```

## Technical Implementation

### Server-Side (Node.js/Express)

#### Weather Controller (`controllers/weather/index.ts`)
- Handles weather API calls to OpenWeatherMap
- Integrates with Google AI for natural language responses
- Provides error handling and data validation

#### Weather Routes (`routes/weather/index.ts`)
- Defines API endpoints for weather functionality
- Handles request/response formatting

### Client-Side (React/TypeScript)

#### AI API Service (`services/api/ai.ts`)
- Provides `getWeather()` method for weather requests
- Handles API communication and error handling

#### Weather Component (`components/weather/Weather.tsx`)
- Displays weather information with beautiful UI
- Shows temperature, conditions, humidity, wind speed
- Includes AI-generated weather summary

#### Chat Integration
- Weather mode can be enabled in the chat interface
- Weather requests are processed separately from regular chat
- Weather data is displayed inline with chat messages

## Error Handling

The weather functionality includes comprehensive error handling:

- **Invalid Location**: Returns user-friendly error message
- **API Failures**: Graceful fallback with error details
- **Network Issues**: Retry logic and timeout handling
- **Missing API Key**: Clear configuration error messages

## Rate Limiting

Weather API calls are subject to OpenWeatherMap's rate limits:
- Free tier: 60 calls/minute
- Paid tiers: Higher limits available

## Security Considerations

- API keys are stored in environment variables
- No sensitive data is exposed to the client
- Input validation prevents injection attacks
- Rate limiting prevents abuse

## Troubleshooting

### Common Issues

1. **"Weather API key not configured"**
   - Ensure `OPENWEATHER_API_KEY` is set in your `.env` file
   - Restart the server after adding the environment variable

2. **"Location not found"**
   - Check the location spelling
   - Try using city and country format (e.g., "London, UK")

3. **Weather data not displaying**
   - Check browser console for errors
   - Verify the weather component is properly imported
   - Ensure the API response format matches expected structure

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed logs for weather API calls and responses.

## Future Enhancements

Potential improvements for the weather functionality:

- **Forecast Support**: Add 5-day weather forecasts
- **Location Autocomplete**: Suggest locations as user types
- **Weather Alerts**: Display severe weather warnings
- **Historical Data**: Show weather trends and patterns
- **Multiple Units**: Support for Fahrenheit/Celsius toggle
- **Weather Maps**: Visual weather map integration
- **Push Notifications**: Weather alerts and updates

## Support

For issues or questions about the weather functionality:

1. Check the troubleshooting section above
2. Review the server logs for error details
3. Verify your OpenWeatherMap API key is valid
4. Test the API endpoints directly using a tool like Postman




