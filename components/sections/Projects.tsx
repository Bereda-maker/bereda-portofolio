'use client';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Code2, Github } from 'lucide-react';
import { STACK_ICON, type Project } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';

const FILTERS = ['All work', 'Products', 'Systems', 'Education', 'Commerce'];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="project-card">
      <div className="project-visual">
        <div className="project-visual-meta"><span>PROJECT / {String(index + 1).padStart(2, '0')}</span><span className="visual-status"><i />{project.demo ? 'LIVE PRODUCT' : 'SOURCE PROJECT'}</span></div>
        {project.image ? (
          <Image src={project.image} alt={project.imageAlt || `${project.title} project preview`} fill sizes="(max-width: 760px) 92vw, (max-width: 1150px) 46vw, 620px" className="project-image" />
        ) : (
          <div className="project-image-fallback" aria-hidden="true"><Code2 size={56} strokeWidth={1} /><span>{project.title}</span></div>
        )}
        <div className="project-image-shade" aria-hidden="true" />
      </div>
      <div className="project-card-content">
        <div className="project-eyebrow"><span>{project.category}</span><span className="project-index">{String(index + 1).padStart(2, '0')}</span></div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="project-stack" aria-label="Technology stack">
          {project.stack.slice(0, 5).map((technology) => <span key={technology} title={technology}><TechIcon k={STACK_ICON[technology]} size={14} />{technology}</span>)}
          {project.stack.length > 5 && <span className="stack-more">+{project.stack.length - 5}</span>}
        </div>
        <div className="project-links">
          {project.demo && <a className="project-link project-link-primary" href={project.demo} target="_blank" rel="noopener noreferrer">Visit live <ArrowUpRight size={15} /></a>}
          <a className="project-link" href={project.repo} target="_blank" rel="noopener noreferrer"><Github size={15} /> Source <ArrowUpRight size={14} /></a>
        </div>
      </div>
    </article>
  );
}

function matchesFilter(project: Project, filter: string) {
  if (filter === 'All work') return true;
  const text = `${project.category} ${project.title}`.toLowerCase();
  if (filter === 'Products') return /product|wellness|finance|collaboration|publishing/.test(text);
  if (filter === 'Systems') return /system|realtime|real-time/.test(text);
  if (filter === 'Education') return /education|learning/.test(text);
  if (filter === 'Commerce') return /commerce|marketplace|payments/.test(text);
  return false;
}

export default function Projects({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState('All work');
  const visible = useMemo(() => projects.filter((project) => matchesFilter(project, filter)), [projects, filter]);
  return (
    <section id="projects" className="projects-section section-shell">
      <div className="section-kicker"><span>03 / SELECTED WORK</span><i /></div>
      <div className="projects-heading">
        <h2>Built to<br /><em>be useful.</em></h2>
        <p>Real products, honest engineering, and working code. Browse the live work or go straight to the repositories.</p>
      </div>
      <div className="project-filters" role="group" aria-label="Filter projects">
        {FILTERS.map((item) => <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}
      </div>
      <div className="projects-grid" aria-live="polite">
        {visible.map((project) => <ProjectCard key={project.repo || project.title} project={project} index={projects.indexOf(project)} />)}
      </div>
      <a className="github-more" href="https://github.com/Bereda-maker?tab=repositories" target="_blank" rel="noopener noreferrer">Explore all repositories <ArrowUpRight size={17} /></a>
    </section>
  );
}
