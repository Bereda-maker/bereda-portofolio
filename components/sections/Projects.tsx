'use client';
import Link from 'next/link';
import { ArrowUpRight, Github } from 'lucide-react';
import { STACK_ICON, type Project } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';
import PictureSlot from '@/components/ui/PictureSlot';

function slugify(title: string) { return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return <article className="reference-project-card">
    <div className="reference-project-media"><PictureSlot p={project} hue={index * 42} /></div>
    <div className="reference-project-body"><div className="flex items-start justify-between gap-4"><div><p className="reference-project-category">{project.category}</p><h3>{project.title}</h3></div><span className="reference-project-number">0{index + 1}</span></div>
      <p className="reference-project-description">{project.description}</p>
      <div className="reference-project-stack">{project.stack.slice(0, 4).map((tech) => <span key={tech}><TechIcon k={STACK_ICON[tech]} size={15} />{tech}</span>)}</div>
      <div className="reference-project-actions"><Link href={`/projects/${slugify(project.title)}`} className="reference-project-link">Build log <ArrowUpRight size={16} /></Link>{project.repo !== '#' && <a href={project.repo} target="_blank" rel="noopener noreferrer" className="reference-project-link reference-project-link-muted"><Github size={15} /> Source</a>}</div>
    </div>
  </article>;
}

export default function Projects({ projects }: { projects: Project[] }) {
  return <section id="projects" className="reference-section reference-projects relative px-5 py-24 sm:px-8 md:px-10 md:py-36"><div className="reference-section-inner relative z-10 mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-8"><div><p className="reference-eyebrow">03 / SELECTED WORK</p><h2 className="reference-section-title">Things I&apos;ve<br /><span>been building.</span></h2></div><p className="reference-body-copy max-w-sm">Real project records, honest descriptions, and the technical decisions behind the interface.</p></div><div className="reference-project-grid mt-14">{projects.slice(0, 6).map((project, index) => <ProjectCard key={project.title} project={project} index={index} />)}</div></div></section>;
}
