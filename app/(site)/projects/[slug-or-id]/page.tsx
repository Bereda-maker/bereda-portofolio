import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Github } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';
import { getProjects } from '@/lib/projects';
import { slugify } from '@/lib/slug';
import { STACK_ICON, type Project } from '@/data/content';
import TechIcon from '@/components/ui/TechIcon';

function findProject(projects: Project[], key: string) {
  const numeric = Number(key);
  if (Number.isInteger(numeric) && numeric > 0 && numeric <= projects.length) return projects[numeric - 1];
  return projects.find((p) => slugify(p.title) === key.toLowerCase());
}
const real = (u: string) => u && u !== '#';

export async function generateMetadata({ params }: { params: { 'slug-or-id': string } }): Promise<Metadata> {
  const project = findProject(await getProjects(), params['slug-or-id']);
  return project ? { title: project.title, description: project.description } : {};
}

export default async function ProjectDetailPage({ params }: { params: { 'slug-or-id': string } }) {
  const projects = await getProjects();
  const project = findProject(projects, params['slug-or-id']);
  if (!project) notFound();
  const linkBtn = 'btn w-full justify-between';

  return (
    <PublicPage title={project.title} intro={project.description}>
      <section className="wrap pb-24">
        <div className="grid gap-10 border-t border-rule pt-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <div>
            <h2 className="font-display text-[1.15rem] font-semibold">Built with</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {project.stack.map((t) => <li key={t} className="tag !bg-white !text-[.9rem]"><TechIcon k={STACK_ICON[t]} size={16} />{t}</li>)}
            </ul>
            <p className="mt-8 font-display text-[.9rem] text-muted">Type: {project.category}</p>
          </div>
          <div>
            <h2 className="font-display text-[1.15rem] font-semibold">Links</h2>
            <div className="mt-4 flex flex-col gap-3">
              {real(project.demo) && <a href={project.demo} target="_blank" rel="noopener noreferrer" className={`${linkBtn} btn-primary`}>Live site <ArrowUpRight size={17} aria-hidden="true" /></a>}
              {real(project.repo) && <a href={project.repo} target="_blank" rel="noopener noreferrer" className={`${linkBtn} btn-quiet`}>Source code <Github size={17} aria-hidden="true" /></a>}
              {!real(project.demo) && !real(project.repo) && <p className="text-muted">A live site and source code for this project haven&rsquo;t been published yet.</p>}
            </div>
            <Link href="/#work" className="mt-8 inline-block font-display text-[.95rem] font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest">Back to all work</Link>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
