import Image from 'next/image';
import { SITE } from '@/data/content';

export default function About() {
  return (
    <section id="about" className="border-t border-rule">
      <div className="wrap grid gap-12 py-20 md:grid-cols-[17rem_1fr] md:gap-20 md:py-28">
        <div className="relative aspect-[4/5] w-full max-w-[17rem] overflow-hidden rounded-lg bg-forest">
          <Image src={SITE.portrait} alt={`Portrait of ${SITE.name}`} fill sizes="272px" className="object-cover object-[50%_12%]" />
        </div>
        <div>
          <h2 className="section-title max-w-[20ch]">About me</h2>
          <div className="mt-7 max-w-[36rem] space-y-5 text-[1.15rem]">
            <p>I&rsquo;m {SITE.name}, a full-stack developer based in {SITE.location}. I like the work that sits between an idea and a working product: designing the data, writing the API, and building an interface people can use without having to be taught.</p>
            <p>I care about clarity and reliability, and about leaving software that the next person can understand after I&rsquo;ve handed it over.</p>
          </div>
          <a href="#contact" className="btn btn-primary mt-9">Start a conversation</a>
        </div>
      </div>
    </section>
  );
}
