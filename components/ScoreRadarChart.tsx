"use client";

// Radar de 5 eixos (uma nota por seção), com a nota exibida em cada eixo
// (estilo scoresu.me). É client component porque recharts renderiza no browser.

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { AnalysisResult } from "@/lib/types";

interface ScoreRadarChartProps {
  sections: AnalysisResult["sections"];
  /** Cor do preenchimento (vem da faixa de nota geral). */
  color?: string;
}

const LABELS: Record<keyof AnalysisResult["sections"], string> = {
  headline: "Headline",
  about: "Sobre",
  experience: "Experiência",
  completeness: "Completude",
  seo: "SEO",
};

export default function ScoreRadarChart({
  sections,
  color = "#4f46e5",
}: ScoreRadarChartProps) {
  const data = (Object.keys(LABELS) as (keyof typeof LABELS)[]).map((key) => {
    const s = sections[key];
    const evaluated = s?.evaluated ?? true;
    return {
      axis: LABELS[key],
      score: evaluated ? s?.score ?? 0 : 0,
      shown: evaluated ? `${s?.score ?? 0}/10` : "N/A",
    };
  });

  // Tick customizado: nome da seção + nota logo abaixo.
  const renderTick = (props: {
    x: number;
    y: number;
    textAnchor: string;
    payload: { value: string };
  }) => {
    const item = data.find((d) => d.axis === props.payload.value);
    return (
      <g>
        <text
          x={props.x}
          y={props.y}
          textAnchor={props.textAnchor as "start" | "middle" | "end"}
          fill="#334155"
          fontSize={12}
          fontWeight={600}
        >
          {props.payload.value}
        </text>
        <text
          x={props.x}
          y={props.y + 14}
          textAnchor={props.textAnchor as "start" | "middle" | "end"}
          fill={color}
          fontSize={11}
          fontWeight={700}
        >
          {item?.shown ?? ""}
        </text>
      </g>
    );
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#e5e7eb" />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <PolarAngleAxis dataKey="axis" tick={renderTick as any} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 9, fill: "#cbd5e1" }}
            axisLine={false}
          />
          <Radar
            name="Nota"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
