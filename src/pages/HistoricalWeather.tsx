import { useState, useEffect } from "react";
import { format, parseISO, subDays, differenceInDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useLocation } from "../store/useWeatherStore";
import { fetchHistoricalWeather, fetchHistoricalAQI } from "../services/api";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
} from "recharts";
import { Loader2, Calendar as CalendarIcon, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function HistoricalWeather() {
  const { location, loading: locLoading } = useLocation();
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(subDays(new Date(), 1));
  const [data, setData] = useState<any>(null);
  const [aqiData, setAqiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      const days = differenceInDays(endDate, startDate);
      if (days < 0) {
        setError("End date must be after start date");
        return;
      }
      if (days > 730) {
        setError("Maximum date range is 2 years (730 days)");
        return;
      }
      setError(null);
      setLoading(true);

      Promise.all([
        fetchHistoricalWeather(location, startDate, endDate),
        fetchHistoricalAQI(location, startDate, endDate),
      ])
        .then(([weather, aqi]) => {
          setData(weather);
          setAqiData(aqi);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [location, startDate, endDate]);

  if (locLoading) {
    return <HistoricalSkeleton />;
  }

  const daily = data?.daily || {};
  const aqiHourly = aqiData?.hourly || {};

  const dailyAqi: Record<string, { pm10: number[]; pm25: number[] }> = {};
  if (aqiHourly.time) {
    aqiHourly.time.forEach((t: string, i: number) => {
      const dateStr = t.split("T")[0];
      if (!dailyAqi[dateStr]) dailyAqi[dateStr] = { pm10: [], pm25: [] };
      if (aqiHourly.pm10[i] != null) dailyAqi[dateStr].pm10.push(aqiHourly.pm10[i]);
      if (aqiHourly.pm2_5[i] != null) dailyAqi[dateStr].pm25.push(aqiHourly.pm2_5[i]);
    });
  }

  const chartData = daily.time?.map((t: string, i: number) => {
    let sunriseIst = null;
    let sunsetIst = null;
    let sunriseStr = "";
    let sunsetStr = "";

    if (daily.sunrise[i]) {
      const srDate = parseISO(daily.sunrise[i]);
      sunriseStr = formatInTimeZone(srDate, "Asia/Kolkata", "HH:mm");
      const [h, m] = sunriseStr.split(":").map(Number);
      sunriseIst = h + m / 60;
    }
    if (daily.sunset[i]) {
      const ssDate = parseISO(daily.sunset[i]);
      sunsetStr = formatInTimeZone(ssDate, "Asia/Kolkata", "HH:mm");
      const [h, m] = sunsetStr.split(":").map(Number);
      sunsetIst = h + m / 60;
    }

    const aqiDay = dailyAqi[t];
    const avgPm10 = aqiDay?.pm10.length ? aqiDay.pm10.reduce((a, b) => a + b, 0) / aqiDay.pm10.length : 0;
    const avgPm25 = aqiDay?.pm25.length ? aqiDay.pm25.reduce((a, b) => a + b, 0) / aqiDay.pm25.length : 0;

    return {
      date: format(parseISO(t), "MMM dd, yyyy"),
      tempMean: daily.temperature_2m_mean[i],
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      sunrise: sunriseIst,
      sunset: sunsetIst,
      sunriseStr,
      sunsetStr,
      precipitation: daily.precipitation_sum[i],
      windSpeed: daily.wind_speed_10m_max[i],
      windDir: daily.wind_direction_10m_dominant[i],
      pm10: avgPm10,
      pm25: avgPm25,
    };
  }) || [];

  const CustomTooltipTime = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md p-4 border border-slate-700/50 rounded-2xl shadow-xl text-slate-100">
          <p className="font-bold mb-3">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <p className="text-sm font-medium">
                {entry.name}: <span className="font-bold">{entry.name === "Sunrise" ? entry.payload.sunriseStr : entry.payload.sunsetStr} IST</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipWind = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md p-4 border border-slate-700/50 rounded-2xl shadow-xl text-slate-100">
          <p className="font-bold mb-3">{label}</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }}></div>
            <p className="text-sm font-medium">
              Max Speed: <span className="font-bold">{payload[0].value} km/h</span>
            </p>
          </div>
          <p className="text-sm text-slate-300 mt-2 font-medium bg-slate-800 px-2 py-1 rounded-lg inline-block">
            Direction: {payload[0].payload.windDir}°
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50 dark:border-slate-800/50">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">Historical Data</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Analyze trends up to 2 years</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none w-full">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm cursor-pointer"
              value={format(startDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month, day] = e.target.value.split("-").map(Number);
                  setStartDate(new Date(year, month - 1, day));
                }
              }}
              max={format(endDate, "yyyy-MM-dd")}
            />
          </div>
          <span className="text-slate-400 font-medium hidden sm:block">to</span>
          <div className="relative flex-1 sm:flex-none w-full">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm cursor-pointer"
              value={format(endDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month, day] = e.target.value.split("-").map(Number);
                  setEndDate(new Date(year, month - 1, day));
                }
              }}
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={item} className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-800/50 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {loading && !error ? (
        <HistoricalSkeleton />
      ) : chartData.length > 0 ? (
        <motion.div variants={container} className="space-y-6">
          {/* Temperature Chart */}
          <ChartWrapper title="Temperature (°C)">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
              <Line type="monotone" dataKey="tempMax" name="Max Temp" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="tempMean" name="Mean Temp" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="tempMin" name="Min Temp" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Brush dataKey="date" height={30} stroke="#cbd5e1" fill="transparent" tickFormatter={() => ''} className="dark:opacity-50" />
            </LineChart>
          </ChartWrapper>

          {/* Sunrise & Sunset Chart */}
          <ChartWrapper title="Sunrise & Sunset (IST)">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 24]} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${Math.floor(val)}:00`} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipTime />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
              <Line type="monotone" dataKey="sunrise" name="Sunrise" stroke="#ea580c" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="sunset" name="Sunset" stroke="#db2777" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Brush dataKey="date" height={30} stroke="#cbd5e1" fill="transparent" tickFormatter={() => ''} className="dark:opacity-50" />
            </LineChart>
          </ChartWrapper>

          {/* Precipitation Chart */}
          <ChartWrapper title="Precipitation (mm)">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
              <Bar dataKey="precipitation" name="Precipitation" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <Brush dataKey="date" height={30} stroke="#cbd5e1" fill="transparent" tickFormatter={() => ''} className="dark:opacity-50" />
            </BarChart>
          </ChartWrapper>

          {/* Wind Chart */}
          <ChartWrapper title="Max Wind Speed & Direction">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="windHistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipWind />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
              <Area type="monotone" dataKey="windSpeed" name="Max Wind Speed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#windHistGrad)" activeDot={{ r: 6, strokeWidth: 0 }} />
              <Brush dataKey="date" height={30} stroke="#cbd5e1" fill="transparent" tickFormatter={() => ''} className="dark:opacity-50" />
            </AreaChart>
          </ChartWrapper>

          {/* AQI Chart */}
          <ChartWrapper title="Air Quality (PM10 & PM2.5)">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
              <Line type="monotone" dataKey="pm10" name="PM10" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Brush dataKey="date" height={30} stroke="#cbd5e1" fill="transparent" tickFormatter={() => ''} className="dark:opacity-50" />
            </LineChart>
          </ChartWrapper>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function ChartWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={item} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/50 dark:border-slate-800/50 flex flex-col h-[400px] hover:shadow-md transition-shadow relative overflow-hidden group">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6">{title}</h3>
      <div className="absolute top-6 right-6 text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 md:hidden opacity-50">
        <span>Swipe</span>
        <ArrowRight className="w-3 h-3" />
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function HistoricalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-[400px] bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl w-full"></div>
      ))}
    </div>
  );
}
