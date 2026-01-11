"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon, CloudIcon, SunIcon, CloudRainIcon, WindIcon, DropletsIcon, EyeIcon } from "lucide-react";
import { useState } from "react";

interface WeatherData {
  location: string;
  timezone: string;
  currentTime: string;
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    wind_speed: number;
    wind_deg: number;
    visibility: number;
    uvi: number;
  };
  units: 'metric' | 'imperial';
  rawData?: any; // Optional raw API response for detailed view
}

interface WeatherProps {
  data: WeatherData;
}

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const getWeatherIcon = (description: string) => {
  const desc = description.toLowerCase();
  if (desc.includes('clear')) return <SunIcon className="size-8 text-yellow-500" />;
  if (desc.includes('cloud')) return <CloudIcon className="size-8 text-gray-500" />;
  if (desc.includes('rain')) return <CloudRainIcon className="size-8 text-blue-500" />;
  return <SunIcon className="size-8 text-yellow-500" />;
};

const formatTemp = (temp: number, units: 'metric' | 'imperial') => {
  const unit = units === 'metric' ? '°C' : '°F';
  return `${Math.round(temp)}${unit}`;
};

export const Weather = ({ data }: WeatherProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const { location, timezone, currentTime, current, units } = data;

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getWeatherIcon(current.description)}
            Weather in {location}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {currentTime} • {timezone}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Weather Summary */}
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">
              {formatTemp(current.temp, units)}
            </div>
            <div className="text-muted-foreground capitalize mb-2">
              {current.description}
            </div>
            <div className="text-sm text-muted-foreground">
              Feels like {formatTemp(current.feels_like, units)}
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <WindIcon className="size-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{current.wind_speed.toFixed(1)} {units === 'imperial' ? 'mph' : 'm/s'}</div>
                <div className="text-muted-foreground">{getWindDirection(current.wind_deg)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropletsIcon className="size-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{current.humidity}%</div>
                <div className="text-muted-foreground">Humidity</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <EyeIcon className="size-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {units === 'imperial'
                    ? `${(current.visibility / 1609).toFixed(1)} mi`
                    : `${(current.visibility / 1000).toFixed(0)} km`
                  }
                </div>
                <div className="text-muted-foreground">Visibility</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SunIcon className="size-4 text-yellow-500" />
              <div>
                <div className="font-medium">{current.uvi.toFixed(1)}</div>
                <div className="text-muted-foreground">UV Index</div>
              </div>
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  );
};
