import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

/* ---------------------------------------------------------------
   MiniDonut — small inline donut chart for coverage rows
   props: {data: [{name, value}], colors: string[], size}
   --------------------------------------------------------------- */
export default function MiniDonut({ data, colors, size = 44 }) {
  const hasValue = data.some((d) => d.value > 0);
  if (!hasValue) return null;
  return (
    <div style={{ width: size, height: size }} className="shrink-0 drop-shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={size * 0.32}
            outerRadius={size * 0.48}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
            stroke="#ffffff"
            strokeWidth={1.5}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

