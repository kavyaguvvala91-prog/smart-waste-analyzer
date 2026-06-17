import { Link } from 'react-router-dom';
import { FiGithub, FiMail, FiArrowUpRight } from 'react-icons/fi';

const footerLinks = [
  { to: '/#features', label: 'Features' },
  { to: '/#overview', label: 'Overview' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/recycling-centers', label: 'Find centers' },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-emerald-100 bg-white backdrop-blur-xl">
      <div className="page-shell section-shell grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <h3 className="soft-heading text-2xl text-slate-900">Cleaner loops, smarter habits.</h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            Smart Waste Analyzer helps people explore, detect, report, and redirect waste toward reuse and recycling
            with a faster, friendlier workflow.
          </p>
          <div className="mt-5 flex items-center gap-3 text-slate-700">
            <a href="mailto:hello@smartwaste.local" className="chip hover:text-emerald-700">
              <FiMail />
              hello@smartwaste.local
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="chip hover:text-emerald-700">
              <FiGithub />
              GitHub
            </a>
          </div>
        </div>

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

        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Built for impact</h4>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Framed around greener choices, the interface keeps the next best action visible at every step.
          </p>
          <Link to="/detect" className="secondary-button mt-5">
            Start a new scan
          </Link>
        </div>
      </div>
    </footer>
  );
}
