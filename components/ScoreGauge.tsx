// Medidor circular da nota geral (0-100). SVG puro, com o arco colorido
// conforme a faixa da nota e uma animação de "crescimento" ao carregar.

interface ScoreGaugeProps {
  score: number;
  /** Cor do arco (vem da faixa de nota calculada na página). */
  color: string;
}

export default function ScoreGauge({ score, color }: ScoreGaugeProps) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative h-48 w-48">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        {/* trilho */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* progresso */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-arc"
          style={
            { "--gauge-circumference": `${circumference}` } as React.CSSProperties
          }
        />
      </svg>
      {/* número no centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-extrabold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-sm font-medium text-gray-400">de 100</span>
      </div>
    </div>
  );
}
