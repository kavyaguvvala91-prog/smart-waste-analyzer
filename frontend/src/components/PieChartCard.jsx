import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { buildPieData } from '../utils/waste';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChartCard({ detections = [], analysis }) {
  const chartData = useMemo(() => {
    const items = buildPieData(detections);
    return {
      labels: items.map((item) => item.label),
      datasets: [
        {
          data: items.map((item) => item.value),
          backgroundColor: items.map((item) => item.color),
          borderColor: 'rgba(255,255,255,0.95)',
          borderWidth: 2,
        },
      ],
    };
  }, [detections]);

  const total = chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);

  return (
    <motion.section whileHover={{ y: -3, scale: 1.005 }} className="glass-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Waste Breakdown</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Closed pie chart by category</h3>
          <p className="mt-2 text-sm text-slate-500">
            A full pie chart keeps the complete composition visible without switching to a donut or gauge.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Total</p>
          <p className="text-2xl font-black text-slate-900">{total}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr] xl:items-center">
        <div className="mx-auto w-full max-w-sm">
          {total > 0 ? <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: true, aspectRatio: 1.05, plugins: { legend: { position: 'bottom', labels: { color: '#0f172a' } } } }} /> : (
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/70 text-center">
              <p className="max-w-sm text-sm text-slate-500">Run a detection first to populate the analysis chart.</p>
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {buildPieData(detections).map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-slate-700">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{item.value}</span>
            </div>
          ))}
          {analysis?.summary ? (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-slate-700">
              {analysis.summary}
            </div>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
