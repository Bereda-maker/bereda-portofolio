'use client';
import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BookOpen, BrainCircuit, Github, HeartPulse, MessageCircle, PanelsTopLeft, ShoppingBag, Sparkles } from 'lucide-react';
import { STACK_ICON, type Project } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';

const FILTERS = ['All work', 'Product', 'Systems', 'Backend', 'Education', 'Collaboration', 'Publishing'];
const art = [
  { icon: BrainCircuit, label: 'LEARN / GROW', color: '#b6ff4a', glow: 'rgba(182,255,74,.22)' },
  { icon: HeartPulse, label: 'FEEL / BETTER', color: '#ff9eab', glow: 'rgba(255,158,171,.2)' },
  { icon: MessageCircle, label: 'HERE / TOGETHER', color: '#a991ff', glow: 'rgba(169,145,255,.22)' },
  { icon: ShoppingBag, label: 'CHECKOUT / READY', color: '#ffc266', glow: 'rgba(255,194,102,.2)' },
  { icon: PanelsTopLeft, label: 'PLAN / SHIP', color: '#67dbff', glow: 'rgba(103,219,255,.2)' },
  { icon: Sparkles, label: 'MONEY / IN FOCUS', color: '#84f1c1', glow: 'rgba(132,241,193,.2)' },
  { icon: BookOpen, label: 'WORDS / AT WORK', color: '#ff9f65', glow: 'rgba(255,159,101,.2)' },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const visual = art[index % art.length];
  const Icon = visual.icon;
  return (
    <article className="project-card group" style={{ '--project-accent': visual.color, '--project-glow': visual.glow } as React.CSSProperties}>
      <div className="project-art" aria-hidden="true">
        <div className="project-art-orbit" />
        <div className="project-art-top"><span>BEREDA / WORK {String(index + 1).padStart(2, '0')}</span><span>0{index + 1} — 07</span></div>
        <div className="project-art-center"><Icon strokeWidth={1.25} /><span>{visual.label}</span></div>
        <div className="project-art-bottom"><span>BUILT WITH INTENT</span><ArrowDownRight size={18} /></div>
      </div>
      <div className="project-card-content">
        <div className="project-eyebrow"><span>{project.category}</span><span className="project-index">{String(index + 1).padStart(2, '0')}</span></div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="project-stack" aria-label="Technology stack">
          {project.stack.map((technology) => <span key={technology} title={technology}><TechIcon k={STACK_ICON[technology]} size={15} />{technology}</span>)}
        </div>
        <div className="project-links">
          {project.demo && project.demo !== '#' && <a className="project-link project-link-primary" href={project.demo} target="_blank" rel="noopener noreferrer">Visit live <ArrowUpRight size={15} /></a>}
          {project.repo && project.repo !== '#' && <a className="project-link" href={project.repo} target="_blank" rel="noopener noreferrer"><Github size={15} /> Source code <ArrowUpRight size={14} /></a>}
        </div>
      </div>
    </article>
  );
}

function matchesFilter(project: Project, filter: string) {
  if (filter === 'All work') return true;
  const text = `${project.category} ${project.title}`.toLowerCase();
  if (filter === 'Product') return /product|finance|wellness/.test(text);
  if (filter === 'Systems') return /system|realtime|real-time/.test(text);
  if (filter === 'Backend') return /backend|commerce/.test(text);
  return text.includes(filter.toLowerCase());
}

export default function Projects({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState('All work');
  const visible = useMemo(() => projects.filter((project) => matchesFilter(project, filter)), [projects, filter]);
  return (
    <section id="projects" className="projects-section">
      <div className="projects-head">
        <div className="section-kicker"><span>SELECTED WORK / 2024—26</span><i /></div>
        <div className="projects-title-row"><h2>Proof of<br /><em>practice.</em></h2><p>Real products, real repositories.<br />A little thought behind every layer.</p></div>
      </div>
      <div className="project-filters" role="group" aria-label="Filter projects">
        {FILTERS.map((item) => <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}
      </div>
      <div className="projects-grid" aria-live="polite">
        {visible.map((project) => <ProjectCard key={project.repo || project.title} project={project} index={projects.indexOf(project)} />)}
      </div>
      <a className="github-more" href="https://github.com/Bereda-maker?tab=repositories" target="_blank" rel="noopener noreferrer">More experiments on GitHub <ArrowUpRight size={17} /></a>
    </section>
  );
}
