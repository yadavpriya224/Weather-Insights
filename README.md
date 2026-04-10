🌦️ WeatherInsightsA high-fidelity weather and air quality monitoring dashboard. WeatherInsights provides real-time atmospheric data, granular air quality metrics, and historical trends for any geographical coordinate.

🚀 OverviewWeatherInsights is designed for users who need more than just "sun or rain." It offers a deep dive into local environments, featuring a comprehensive Air Quality Index (AQI) breakdown and interactive hourly forecasts for temperature, humidity, and visibility.

✨ Key FeaturesReal-time Weather: Current temperature, high/low tracking, and "Sunny & Clear" status.Deep Air Quality Analytics: Detailed breakdown of PM10, PM2.5, CO, NO2, and SO2 levels.Interactive Hourly Charts: Visualized trends for:Temperature & Relative HumidityPrecipitation Probability (0% to 100%)Visibility (km) & Wind Speed (km/h)Historical Data: Toggle between "Today" and historical views to analyze past weather patterns.Unit Conversion: Seamlessly switch between Celsius (°C) and Fahrenheit (°F).Astronomical Timing: Precise sunrise and sunset tracking.

📊 Technical Metrics TrackedMetricRange/UnitImportanceAQI0 - 500+General health indexPM10 / PM2.5$\mu g/m^3$Fine particulate matter trackingUV Index0 - 11+Skin safety and solar intensityVisibilitykmTransportation and safety data🛠️ Installation & SetupClone the RepositoryBashgit 

clone https://github.com/yadavpriya224/weather-insights.git
cd weather-insights
Install DependenciesBashnpm install
Environment Variables
Create a .env file in the root directory and add your API keys:Code snippetVITE_WEATHER_API_KEY=your_key_here
VITE_AQI_API_KEY=your_key_here
Run Development ServerBashnpm run dev

🖥️ UsageLocation Search: Enter coordinates (e.g., 28.6293, 77.4397) to fetch hyper-local data.Toggle History: Use the top-left navigation to switch between real-time data and historical logs.Analyze Air Quality: Hover over the PM10/PM2.5 charts to see specific concentrations at any hour.
