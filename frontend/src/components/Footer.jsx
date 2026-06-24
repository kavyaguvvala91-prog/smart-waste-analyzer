import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';

const footerLinks = [
  { to: '/#features', label: 'Features' },
  { to: '/#overview', label: 'Overview' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/recycling-centers', label: 'Find centers' },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-emerald-100 bg-white backdrop-blur-xl">
      <div className="page-shell section-shell grid gap-10">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Explore</h4>
          <ul className="mt-4 space-y-3">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="group flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700">
                  {link.label}
                  <FiArrowUpRight className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
