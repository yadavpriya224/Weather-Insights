import { useState, useEffect, ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { useLocation } from "../store/useWeatherStore";
import { fetchCurrentWeather, fetchCurrentAQI } from "../services/api";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from "recharts";
import { Loader2, Thermometer, Droplets, Sunrise, Sunset, Wind, Sun, Activity, MapPin, Calendar, CloudRain, Moon, Cloud, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CurrentWeather() {
  const { location, loading: locLoading } = useLocation();
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<any>(null);
  const [aqiData, setAqiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFahrenheit, setIsFahrenheit] = useState(false);

  useEffect(() => {
    if (location) {
      setLoading(true);
      setError(null);
      Promise.all([fetchCurrentWeather(location, date), fetchCurrentAQI(location, date)])
        .then(([weather, aqi]) => {
          setData(weather);
          setAqiData(aqi);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || "Failed to fetch weather data");
        })
        .finally(() => setLoading(false));
    }
  }, [location, date]);

  if (locLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-800/50 flex flex-col items-center gap-3 shadow-sm max-w-md text-center">
          <span className="font-bold text-lg">Oops! Something went wrong.</span>
          <span className="font-medium text-sm">{error}</span>
          <button
            onClick={() => setDate(new Date())}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-lg text-sm font-bold transition-all"
          >
            Reset to Today
          </button>
        </div>
      </div>
    );
  }

  if (!data || !aqiData) return null;

  const daily = data.daily || {};
  const hourly = data.hourly || {};
  const aqiHourly = aqiData.hourly || {};

  // Current values
  const currentTemp = data.current?.temperature_2m ?? hourly.temperature_2m?.[new Date().getHours()] ?? "N/A";
  const minTemp = daily.temperature_2m_min?.[0] ?? "N/A";
  const maxTemp = daily.temperature_2m_max?.[0] ?? "N/A";
  const precipitation = data.current?.precipitation ?? daily.precipitation_sum?.[0] ?? "N/A";
  const sunrise = daily.sunrise?.[0] ? format(parseISO(daily.sunrise[0]), "HH:mm") : "N/A";
  const sunset = daily.sunset?.[0] ? format(parseISO(daily.sunset[0]), "HH:mm") : "N/A";
  const maxWindSpeed = daily.wind_speed_10m_max?.[0] ?? "N/A";
  const relativeHumidity = data.current?.relative_humidity_2m ?? hourly.relative_humidity_2m?.[new Date().getHours()] ?? "N/A";
  const uvIndex = daily.uv_index_max?.[0] ?? "N/A";
  const precipProbMax = daily.precipitation_probability_max?.[0] ?? "N/A";

  // AQI values (current hour)
  const currentHour = new Date().getHours();
  const aqi = aqiHourly.european_aqi?.[currentHour] ?? "N/A";
  const pm10 = aqiHourly.pm10?.[currentHour] ?? "N/A";
  const pm25 = aqiHourly.pm2_5?.[currentHour] ?? "N/A";
  const co = aqiHourly.carbon_monoxide?.[currentHour] ?? "N/A";
  const no2 = aqiHourly.nitrogen_dioxide?.[currentHour] ?? "N/A";
  const so2 = aqiHourly.sulphur_dioxide?.[currentHour] ?? "N/A";
  const co2 = "N/A";

  const formatTemp = (celsius: number | string) => {
    if (celsius === "N/A") return "N/A";
    const val = typeof celsius === "string" ? parseFloat(celsius) : celsius;
    return isFahrenheit ? ((val * 9) / 5 + 32).toFixed(1) + "°F" : val.toFixed(1) + "°C";
  };

  const getTempVal = (celsius: number) => isFahrenheit ? (celsius * 9) / 5 + 32 : celsius;

  const hourlyChartData = hourly.time?.map((t: string, i: number) => ({
    time: format(parseISO(t), "HH:mm"),
    temperature: getTempVal(hourly.temperature_2m[i]),
    humidity: hourly.relative_humidity_2m[i],
    precipitation: hourly.precipitation[i],
    visibility: hourly.visibility[i] / 1000,
    windSpeed: hourly.wind_speed_10m[i],
    pm10: aqiHourly.pm10?.[i] || 0,
    pm25: aqiHourly.pm2_5?.[i] || 0,
  })) || [];

  const isRaining = parseFloat(precipitation as string) > 0;
  const currentHourNum = new Date().getHours();
  const sunriseHour = sunrise !== "N/A" ? parseInt(sunrise.split(":")[0]) : 6;
  const sunsetHour = sunset !== "N/A" ? parseInt(sunset.split(":")[0]) : 18;
  const isNight = currentHourNum < sunriseHour || currentHourNum > sunsetHour;

  let heroGradient = "from-blue-500 to-sky-400 dark:from-blue-900 dark:to-sky-800";
  let WeatherIcon = Sun;
  let weatherLabel = "Sunny & Clear";

  if (isRaining) {
    heroGradient = "from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950";
    WeatherIcon = CloudRain;
    weatherLabel = "Rainy";
  } else if (currentHourNum === sunriseHour) {
    heroGradient = "from-orange-400 to-rose-400 dark:from-orange-900 dark:to-rose-900";
    WeatherIcon = Sunrise;
    weatherLabel = "Sunrise";
  } else if (currentHourNum === sunsetHour) {
    heroGradient = "from-rose-500 to-purple-500 dark:from-rose-900 dark:to-purple-900";
    WeatherIcon = Sunset;
    weatherLabel = "Sunset";
  } else if (isNight) {
    heroGradient = "from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-black";
    WeatherIcon = Moon;
    weatherLabel = "Clear Night";
  } else if (parseFloat(data.current?.cloudcover || "0") > 50) {
    heroGradient = "from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600";
    WeatherIcon = Cloud;
    weatherLabel = "Cloudy";
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item} className={`relative overflow-hidden rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br ${heroGradient} transition-colors duration-500`}>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20 pointer-events-none">
          <WeatherIcon className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-white/90 font-medium mb-6 bg-white/20 dark:bg-black/20 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
              <MapPin className="w-4 h-4" />
              <span>{location?.lat.toFixed(4)}, {location?.lon.toFixed(4)}</span>
            </div>
            <h2 className="text-7xl md:text-8xl font-black tracking-tighter mb-2 drop-shadow-md">
              {formatTemp(currentTemp)}
            </h2>
            <p className="text-2xl font-medium text-white/90 flex items-center gap-2 drop-shadow-sm">
              <WeatherIcon className="w-7 h-7" />
              {weatherLabel}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none w-full sm:w-auto">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 dark:text-slate-300 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-11 pr-4 py-3 border border-white/20 rounded-2xl text-sm font-bold bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-white/50 outline-none transition-all shadow-lg backdrop-blur-md cursor-pointer"
                value={format(date, "yyyy-MM-dd")}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split("-").map(Number);
                    setDate(new Date(year, month - 1, day));
                  }
                }}
                max={format(new Date(new Date().setDate(new Date().getDate() + 14)), "yyyy-MM-dd")}
              />
            </div>
            <button
              onClick={() => setIsFahrenheit(!isFahrenheit)}
              className="px-6 py-3 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 flex-1 md:flex-none text-center w-full sm:w-auto"
            >
              {isFahrenheit ? "Switch to °C" : "Switch to °F"}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={<Thermometer />} title="Temperature" value={formatTemp(currentTemp)} sub={`L: ${formatTemp(minTemp)} · H: ${formatTemp(maxTemp)}`} color="blue" />
        <StatCard icon={<Droplets />} title="Precipitation" value={`${precipitation} mm`} sub={`Max Prob: ${precipProbMax}%`} color="sky" />
        <StatCard icon={<Sunrise />} title="Sunrise" value={sunrise} color="orange" />
        <StatCard icon={<Sunset />} title="Sunset" value={sunset} color="purple" />
        <StatCard icon={<Wind />} title="Max Wind" value={`${maxWindSpeed} km/h`} color="teal" />
        <StatCard icon={<Droplets />} title="Humidity" value={`${relativeHumidity}%`} color="cyan" />
        <StatCard icon={<Sun />} title="UV Index" value={uvIndex} color="yellow" />
        <StatCard icon={<Activity />} title="AQI" value={aqi} color="emerald" />
        <StatCard title="PM10" value={`${pm10} μg/m³`} color="slate" />
        <StatCard title="PM2.5" value={`${pm25} μg/m³`} color="slate" />
        <StatCard title="CO" value={`${co} μg/m³`} color="slate" />
        <StatCard title="NO2" value={`${no2} μg/m³`} color="slate" />
        <StatCard title="SO2" value={`${so2} μg/m³`} color="slate" />
        <StatCard title="CO2" value={co2} sub="Data unavailable" color="slate" />
      </motion.div>

      <motion.div variants={item} className="space-y-6 pt-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-blue-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Hourly Forecast</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={`Temperature (${isFahrenheit ? '°F' : '°C'})`} data={hourlyChartData} dataKey="temperature" color="#ef4444" gradientId="tempGrad" />
          <ChartCard title="Relative Humidity (%)" data={hourlyChartData} dataKey="humidity" color="#3b82f6" gradientId="humGrad" />
          <ChartCard title="Precipitation (mm)" data={hourlyChartData} dataKey="precipitation" color="#0ea5e9" gradientId="precipGrad" />
          <ChartCard title="Visibility (km)" data={hourlyChartData} dataKey="visibility" color="#8b5cf6" gradientId="visGrad" />
          <ChartCard title="Wind Speed (km/h)" data={hourlyChartData} dataKey="windSpeed" color="#10b981" gradientId="windGrad" />
          
          <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50 dark:border-slate-800/50 flex flex-col h-[350px] hover:shadow-md transition-shadow relative overflow-hidden group">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6">PM10 & PM2.5 (μg/m³)</h3>
            <div className="absolute top-6 right-6 text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 md:hidden opacity-50">
              <span>Swipe</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="pm10" name="PM10" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Brush dataKey="time" height={30} stroke="#cbd5e1" fill="transparent" tickFormatter={() => ''} className="dark:opacity-50" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, title, value, sub, color = "blue" }: { icon?: ReactNode; title: string; value: string | number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    slate: "bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
  };

  return (
    <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-sm border border-white/50 dark:border-slate-800/50 flex flex-col justify-between hover:shadow-xl transition-all hover:-translate-y-1 group">
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className={`p-2.5 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>}
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <div>
        <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</div>
        {sub && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{sub}</div>}
      </div>
    </motion.div>
  );
}

function ChartCard({ title, data, dataKey, color, gradientId }: { title: string; data: any[]; dataKey: string; color: string; gradientId: string }) {
  return (
    <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50 dark:border-slate-800/50 flex flex-col h-[350px] hover:shadow-md transition-shadow relative overflow-hidden group">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6">{title}</h3>
      <div className="absolute top-6 right-6 text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 md:hidden opacity-50">
        <span>Swipe</span>
        <ArrowRight className="w-3 h-3" />
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
              itemStyle={{ color: color, fontWeight: 700 }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#${gradientId})`} activeDot={{ r: 6, strokeWidth: 0 }} />
            <Brush dataKey="time" height={30} stroke="#cbd5e1" fill="transparent" tickFormatter={() => ''} className="dark:opacity-50" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-64 bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl w-full"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl"></div>
        ))}
      </div>
      <div className="h-80 bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl w-full"></div>
    </div>
  );
}
