export type OpportunitySourceGroup = 'Remote & general jobs' | 'Freelance marketplaces' | 'Careers & internships' | 'Open-source programs' | 'Startup & co-founder networks';
export type OpportunityFeedKind = 'himalayas' | 'rss' | 'trulyremotework' | 'greenhouse';
export type OpportunitySourceAccess = 'verified_feed' | 'browse_only' | 'member_only';

export type OpportunitySource = {
  id: string;
  name: string;
  group: OpportunitySourceGroup;
  url: string;
  access: OpportunitySourceAccess;
  note: string;
  feedKind?: OpportunityFeedKind;
  feedUrl?: string;
};

const browseNote = 'Browse directly on the platform; no verified public feed suitable for automatic recommendations.';
const termsNote = 'Browse directly only; automated collection or reuse is not cleared by the platform terms.';
const memberNote = 'Member or sign-in access is required; private profiles and listings are not searched.';

export const OPPORTUNITY_SOURCES: readonly OpportunitySource[] = [
  { id: 'himalayas', name: 'Himalayas', group: 'Remote & general jobs', url: 'https://himalayas.app/jobs', access: 'verified_feed', note: 'Public jobs API; cache results, show source attribution, and link back to the Himalayas listing.', feedKind: 'himalayas', feedUrl: 'https://himalayas.app/jobs/api/search' },
  { id: 'weworkremotely', name: 'We Work Remotely', group: 'Remote & general jobs', url: 'https://weworkremotely.com/', access: 'verified_feed', note: 'Public RSS feed; attribute links back to We Work Remotely.', feedKind: 'rss', feedUrl: 'https://weworkremotely.com/categories/remote-programming-jobs.rss' },
  { id: 'remoteok', name: 'Remote OK', group: 'Remote & general jobs', url: 'https://remoteok.com/remote-api-jobs', access: 'browse_only', note: 'Manual search only; the API/query paths are disallowed by its robots policy and reuse permission was not verified.' },
  { id: 'wellfound', name: 'Wellfound', group: 'Remote & general jobs', url: 'https://wellfound.com/jobs', access: 'browse_only', note: termsNote },
  { id: 'linkedin', name: 'LinkedIn Jobs', group: 'Remote & general jobs', url: 'https://www.linkedin.com/jobs/', access: 'browse_only', note: 'Automated scraping is prohibited; use LinkedIn search directly.' },
  { id: 'remotive', name: 'Remotive', group: 'Remote & general jobs', url: 'https://remotive.com/remote-jobs/software-dev', access: 'verified_feed', note: 'Public software-development RSS feed; identify Remotive and link each listing back to its source.', feedKind: 'rss', feedUrl: 'https://remotive.com/remote-jobs/feed/software-development' },
  { id: 'workingnomads', name: 'Working Nomads', group: 'Remote & general jobs', url: 'https://www.workingnomads.com/jobs', access: 'browse_only', note: termsNote },
  { id: 'nodesk', name: 'NoDesk', group: 'Remote & general jobs', url: 'https://nodesk.co/remote-jobs/', access: 'browse_only', note: termsNote },
  { id: 'justremote', name: 'JustRemote', group: 'Remote & general jobs', url: 'https://justremote.co/remote-jobs', access: 'browse_only', note: termsNote },
  { id: 'jobgether', name: 'Jobgether', group: 'Remote & general jobs', url: 'https://jobgether.com/search-offers', access: 'browse_only', note: 'Official API exists, but the terms conflict with automated access; direct users to the search page.' },
  { id: 'jobspresso', name: 'Jobspresso', group: 'Remote & general jobs', url: 'https://jobspresso.co/remote-work/', access: 'browse_only', note: termsNote },
  { id: 'remoteco', name: 'Remote.co', group: 'Remote & general jobs', url: 'https://remote.co/remote-jobs/', access: 'browse_only', note: 'Terms prohibit automated collection and reuse; link users to the job directory.' },
  { id: 'arcdev', name: 'Arc.dev', group: 'Remote & general jobs', url: 'https://arc.dev/en-us/remote-jobs', access: 'browse_only', note: 'Terms prohibit automated scraping, crawling, and monitoring.' },
  { id: 'trulyremotework', name: 'TrulyRemoteWork', group: 'Remote & general jobs', url: 'https://trulyremotework.com/work-from-home-jobs', access: 'verified_feed', note: 'Documented public jobs API; cache responses, link to the listing, and verify eligibility before applying.', feedKind: 'trulyremotework', feedUrl: 'https://trulyremotework.com/api/v1/jobs' },
  { id: 'hireeing', name: 'HireEing', group: 'Remote & general jobs', url: 'https://hireeing.com/jobs', access: 'browse_only', note: 'Search and API paths are disallowed for crawlers; use as a manual search destination.' },
  { id: 'upwork', name: 'Upwork', group: 'Freelance marketplaces', url: 'https://www.upwork.com/freelance-jobs/', access: 'browse_only', note: 'Public API requires an approved application; automated access is not enabled.' },
  { id: 'contra', name: 'Contra', group: 'Freelance marketplaces', url: 'https://contra.com/featured-jobs/freelance-tech-jobs', access: 'browse_only', note: 'Terms prohibit automated content collection; use the public featured-jobs page.' },
  { id: 'fiverr', name: 'Fiverr', group: 'Freelance marketplaces', url: 'https://www.fiverr.com/', access: 'browse_only', note: 'Terms prohibit scraping and automated retrieval; search manually on Fiverr.' },
  { id: 'freelancer', name: 'Freelancer.com', group: 'Freelance marketplaces', url: 'https://www.freelancer.com/job/', access: 'browse_only', note: 'Terms require express permission for automated collection and aggregation.' },
  { id: 'peopleperhour', name: 'PeoplePerHour', group: 'Freelance marketplaces', url: 'https://www.peopleperhour.com/freelance-jobs', access: 'browse_only', note: 'Terms prohibit automated scraping; direct users to the public jobs page.' },
  { id: 'guru', name: 'Guru', group: 'Freelance marketplaces', url: 'https://www.guru.com/d/jobs/', access: 'browse_only', note: 'No public job API/feed was verified; search paths are restricted for crawlers.' },
  { id: 'toptal', name: 'Toptal', group: 'Freelance marketplaces', url: 'https://www.toptal.com/freelance-jobs', access: 'browse_only', note: 'Terms prohibit automated extraction; many opportunities are limited to accepted network members.' },
  { id: 'gunio', name: 'Gun.io', group: 'Freelance marketplaces', url: 'https://gun.io/jobs/', access: 'browse_only', note: 'Terms prohibit automated collection without written consent; many roles require a candidate profile.' },
  { id: 'turing', name: 'Turing', group: 'Freelance marketplaces', url: 'https://work.turing.com/jobs', access: 'browse_only', note: 'Terms prohibit listing extraction without written authorization.' },
  { id: 'codementor', name: 'Codementor', group: 'Freelance marketplaces', url: 'https://www.codementor.io/experts', access: 'browse_only', note: 'Expert profiles may not be repurposed without permission; browse manually.' },
  { id: 'googlecareers', name: 'Google Careers', group: 'Careers & internships', url: 'https://www.google.com/about/careers/applications/jobs/results', access: 'browse_only', note: 'Public XML feed is large and its automated reuse terms are unclear; search manually on Google Careers.' },
  { id: 'microsoftcareers', name: 'Microsoft Careers', group: 'Careers & internships', url: 'https://careers.microsoft.com/', access: 'browse_only', note: 'Public search exists, but no approved job feed/API was verified.' },
  { id: 'amazonjobs', name: 'Amazon Jobs', group: 'Careers & internships', url: 'https://www.amazon.jobs/en/search', access: 'browse_only', note: 'Public search is available; automated listing reuse permission was not verified.' },
  { id: 'wikimedia', name: 'Wikimedia Foundation (Greenhouse)', group: 'Careers & internships', url: 'https://job-boards.greenhouse.io/wikimedia', access: 'verified_feed', note: 'Greenhouse documents a public jobs API; display Wikimedia as the employer and link to its original listing.', feedKind: 'greenhouse', feedUrl: 'https://boards-api.greenhouse.io/v1/boards/wikimedia/jobs?content=true' },
  { id: 'belsoft', name: 'Belsoft Solutions internships', group: 'Careers & internships', url: 'https://www.belsoftsolutions.com/internships', access: 'browse_only', note: 'The page states applications are closed; do not present those listings as open roles.' },
  { id: 'nexorlio', name: 'Nexorlio internship', group: 'Careers & internships', url: 'https://www.nexorlio.com/careers/software-developer-intern', access: 'browse_only', note: termsNote },
  { id: 'taskintern', name: 'TaskIntern', group: 'Careers & internships', url: 'https://internship.taskintern.com/remote-software-internship', access: 'browse_only', note: 'Public pages are available, but no approved public API/feed was verified; terms limit use.' },
  { id: 'intelsq', name: 'IntelSQ internship', group: 'Careers & internships', url: 'https://www.intelsq.com/careers', access: 'browse_only', note: 'Public careers page only; API paths are disallowed and terms are unclear.' },
  { id: 'jetbrainsinternship', name: 'JetBrains internships', group: 'Careers & internships', url: 'https://internship.jetbrains.com/', access: 'member_only', note: 'No public listings feed or searchable directory was verified; sign-in may be required.' },
  { id: 'githubexplore', name: 'GitHub Explore', group: 'Open-source programs', url: 'https://github.com/explore', access: 'browse_only', note: 'Explore is not a job feed; GitHub API can search public repositories, not openings. Search manually.' },
  { id: 'gsoc', name: 'Google Summer of Code', group: 'Open-source programs', url: 'https://summerofcode.withgoogle.com/programs/2026/projects', access: 'browse_only', note: 'Public project search exists, but no official API or listing feed was verified.' },
  { id: 'outreachy', name: 'Outreachy', group: 'Open-source programs', url: 'https://www.outreachy.org/apply/project-selection/', access: 'browse_only', note: 'Public project list may hide details behind sign-in; review eligibility on the source site.' },
  { id: 'mlh', name: 'Major League Hacking (MLH)', group: 'Open-source programs', url: 'https://www.mlh.com/seasons/2027/events', access: 'browse_only', note: 'Public events page; terms do not clear automated commercial reuse.' },
  { id: 'msresearchinternship', name: 'Microsoft Research undergraduate internship', group: 'Careers & internships', url: 'https://www.microsoft.com/en-us/research/academic-program/undergraduate-internship/', access: 'browse_only', note: 'A reference page, not a searchable jobs feed; no API or listing feed was verified.' },
  { id: 'metacareers', name: 'Meta Careers', group: 'Careers & internships', url: 'https://www.metacareers.com/jobsearch/', access: 'browse_only', note: 'Automated collection is prohibited without express permission.' },
  { id: 'yc-cofounder', name: 'YC Co-Founder Matching', group: 'Startup & co-founder networks', url: 'https://www.ycombinator.com/cofounder-matching', access: 'member_only', note: 'Profiles are private to approved members; only the public landing page is linked.' },
  { id: 'coffeespace', name: 'CoffeeSpace', group: 'Startup & co-founder networks', url: 'https://www.coffeespace.com/', access: 'member_only', note: 'Matching and talent features require registration; no public listings feed was verified.' },
  { id: 'cofounderslab', name: 'CoFoundersLab', group: 'Startup & co-founder networks', url: 'https://cofounderslab.com/search', access: 'member_only', note: 'Search requires sign-in and terms prohibit automated access.' },
  { id: 'antler', name: 'Antler', group: 'Startup & co-founder networks', url: 'https://careers.antler.co/jobs', access: 'browse_only', note: 'Public portfolio-company job board; no feed/API or automated reuse permission was verified.' },
  { id: 'f6s', name: 'F6S', group: 'Startup & co-founder networks', url: 'https://www.f6s.com/programs', access: 'browse_only', note: 'Terms and robots rules prohibit automated crawling; browse programs directly.' },
  { id: 'gust', name: 'Gust', group: 'Startup & co-founder networks', url: 'https://gust.com/find-investors', access: 'browse_only', note: 'Public directory exists, but terms do not permit automated collection or aggregation.' },
  { id: 'founderinstitute', name: 'Founder Institute', group: 'Startup & co-founder networks', url: 'https://fi.co/enrolling', access: 'browse_only', note: 'Terms prohibit automated access without written permission.' },
  { id: 'indiehackers', name: 'Indie Hackers', group: 'Startup & co-founder networks', url: 'https://www.indiehackers.com/', access: 'browse_only', note: 'Terms prohibit scraping and storage of significant content; no active jobs feed was verified.' },
  { id: 'foundersnetwork', name: 'Founders Network', group: 'Startup & co-founder networks', url: 'https://foundersnetwork.com/', access: 'member_only', note: 'Curated membership community; terms prohibit scraping and there is no public founder directory.' },
  { id: 'foundersbase', name: 'Foundersbase', group: 'Startup & co-founder networks', url: 'https://foundersbase.com/jobs', access: 'browse_only', note: 'Jobs/API paths are disallowed for crawlers and automated reuse is restricted.' },
] as const satisfies readonly OpportunitySource[];

export const VERIFIED_AUTOMATED_SOURCES = OPPORTUNITY_SOURCES.filter((source) => source.access === 'verified_feed');
