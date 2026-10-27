import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Github } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';
import { getProjects } from '@/lib/projects';
import { STACK_ICON, type Project } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function findProject(projects: Project[], key: string) {
  const numeric = Number(key);
  if (Number.isInteger(numeric) && numeric > 0 && numeric <= projects.length) return projects[numeric - 1];
  return projects.find((project) => slugify(project.title) === key.toLowerCase());
}

export default async function ProjectDetailPage({ params }: { params: { 'slug-or-id': string } }) {
  const projects = await getProjects();
  const project = findProject(projects, params['slug-or-id']);
  if (!project) notFound();
  return <PublicPage eyebrow="02 / Build log" title={<>{project.title}<br /><span className="text-[#D7E2EA]">in detail.</span></>} intro={project.description}><section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 md:px-10"><div className="grid gap-8 md:grid-cols-[1.15fr_.85fr]"><div className="rounded-[36px] border border-[#D7E2EA]/20 bg-[#D7E2EA]/[.04] p-7 sm:p-10"><p className="project-kicker">{project.category} / selected build</p><h2 className="mb-5 text-3xl font-medium uppercase sm:text-5xl">A closer look</h2><p className="max-w-2xl text-lg font-light leading-relaxed text-[#D7E2EA]/70">This project is part of the public portfolio archive. The page presents the available project record without implying a live demo, repository or external integration where one has not been provided.</p><div className="mt-8 flex flex-wrap gap-2">{project.stack.map((tech) => <span key={tech} className="inline-flex items-center gap-2 rounded-full border border-[#D7E2EA]/15 bg-[#D7E2EA]/[.06] px-4 py-2 text-xs uppercase tracking-wider"><TechIcon k={STACK_ICON[tech]} />{tech}</span>)}</div></div><div className="rounded-[36px] bg-white p-7 text-[#0C0C0C] sm:p-10"><p className="mb-6 text-xs uppercase tracking-[.2em] opacity-50">Project links</p><div className="flex flex-col gap-3">{project.demo !== '#' && <a href={project.demo} target="_blank" rel="noopener noreferrer" className="cbtn inline-flex items-center justify-between rounded-full px-6 py-4 text-sm font-medium uppercase tracking-widest text-white">Live demo <ArrowUpRight size={17} /></a>}{project.repo !== '#' && <a href={project.repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between rounded-full border border-[#0C0C0C]/20 px-6 py-4 text-sm font-medium uppercase tracking-widest">Source <Github size={17} /></a>}{project.demo === '#' && project.repo === '#' && <p className="text-base font-light leading-relaxed opacity-65">No public links have been configured for this project yet.</p>}</div><Link href="/#projects" className="mt-8 inline-block text-xs uppercase tracking-widest opacity-60 hover:opacity-100">← Back to all work</Link></div></div></section></PublicPage>;
}
