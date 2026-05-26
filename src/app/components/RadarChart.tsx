interface RadarChartProps {
  data: {
    label: string;
    value: number; // 0-100
  }[];
  size?: number;
}

export default function RadarChart({ data, size = 240 }: RadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) - 40;
  const numAxes = data.length;
  const levels = 5;

  const getPolygonPoints = (levelFraction: number) => {
    const points: string[] = [];
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const x = center + Math.cos(angle) * radius * levelFraction;
      const y = center + Math.sin(angle) * radius * levelFraction;
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const dataPoints = data.map((item, i) => {
    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
    const levelFraction = item.value / 100;
    const x = center + Math.cos(angle) * radius * levelFraction;
    const y = center + Math.sin(angle) * radius * levelFraction;
    return { x, y, label: item.label, value: item.value };
  });

  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid hexagons */}
      {Array.from({ length: levels }).map((_, i) => {
        const levelFraction = (i + 1) / levels;
        return (
          <polygon
            key={`grid-${i}`}
            points={getPolygonPoints(levelFraction)}
            fill="none"
            stroke="rgba(110, 80, 200, 0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        return (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(110, 80, 200, 0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygonPoints}
        fill="rgb(110, 80, 200)"
        fillOpacity="0.15"
        stroke="rgb(110, 80, 200)"
        strokeWidth="2"
      />

      {/* Data points */}
      {dataPoints.map((point, i) => (
        <circle
          key={`point-${i}`}
          cx={point.x}
          cy={point.y}
          r="4"
          fill="rgb(110, 80, 200)"
        />
      ))}

      {/* Labels */}
      {data.map((item, i) => {
        const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
        const labelDistance = radius + 25;
        const x = center + Math.cos(angle) * labelDistance;
        const y = center + Math.sin(angle) * labelDistance;

        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (x < center - 10) textAnchor = 'end';
        else if (x > center + 10) textAnchor = 'start';

        return (
          <text
            key={`label-${i}`}
            x={x}
            y={y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            className="text-xs font-medium"
            fill="#5A4880"
          >
            {item.label}
          </text>
        );
      })}
    </svg>
  );
}
