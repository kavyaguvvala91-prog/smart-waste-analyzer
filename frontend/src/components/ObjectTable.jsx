import { motion } from 'framer-motion';
import { aggregateDetections, formatConfidence } from '../utils/waste';

export default function ObjectTable({ detections = [] }) {
  const rows = aggregateDetections(detections);

  return (
    <motion.section whileHover={{ y: -3, scale: 1.005 }} className="glass-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Detected Objects</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Object table</h3>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-100 bg-white">
        <table className="min-w-full divide-y divide-emerald-100">
          <thead className="bg-emerald-50/70">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Object Name</th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Count</th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {rows.length > 0 ? rows.map((row) => (
              <tr key={row.className} className="transition hover:bg-emerald-50/70">
                <td className="px-5 py-4 text-sm font-semibold text-slate-900">{row.className}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{row.count}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{formatConfidence(row.confidence)}</td>
              </tr>
            )) : (
              <tr>
                <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={3}>
                  No detected objects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
