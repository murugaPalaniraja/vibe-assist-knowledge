// Single source of truth for the navigation taxonomy.
// Plain .mjs so the content schema, the pages, and the Node validation
// scripts all read the same lists.
//
// Navigation is hierarchical (category -> technology -> article) but every
// page is published at a single-segment URL (/backend, /java, /java-hashmap).

/** @typedef {{ slug: string, name: string, description: string, nav?: boolean }} Category */

/** @type {Category[]} */
export const categories = [
  { slug: 'programming', name: 'Programming', nav: true, description: 'Language fundamentals: data structures, memory, concurrency, error handling and idioms in Java, Python, JavaScript, TypeScript and C#.' },
  { slug: 'backend', name: 'Backend', nav: true, description: 'Server-side frameworks, REST APIs, dependency injection and service design with Spring Boot, .NET and Node.js.' },
  { slug: 'frontend', name: 'Frontend', nav: true, description: 'Browser applications with React, Angular, Next.js and TypeScript.' },
  { slug: 'databases', name: 'Databases', nav: true, description: 'Transactions, indexing, connection pooling and caching with PostgreSQL, MySQL, MongoDB and Redis.' },
  { slug: 'devops', name: 'DevOps', nav: true, description: 'Containers, CI/CD pipelines, Kubernetes and infrastructure as code.' },
  { slug: 'cloud', name: 'Cloud', description: 'Cloud platforms, managed services and cloud-native design.' },
  { slug: 'architecture', name: 'Architecture', nav: true, description: 'SOLID, Clean Architecture, design patterns and microservices.' },
  { slug: 'security', name: 'Security', nav: true, description: 'Authentication, authorization, token handling and secure coding.' },
  { slug: 'testing', name: 'Testing & Code Quality', nav: true, description: 'Test strategy, code review practice, and unit, integration and end-to-end testing.' },
  { slug: 'performance', name: 'Performance', description: 'Profiling, latency, throughput and resource efficiency.' },
  { slug: 'ai-engineering', name: 'AI Engineering', nav: true, description: 'LLMs, prompt engineering, AI agents and retrieval-augmented generation.' },
  { slug: 'developer-tools', name: 'Developer Tools', description: 'Git, IDEs, build tools and developer workflow.' },
  { slug: 'system-design', name: 'System Design', description: 'Scalability, reliability and distributed-systems trade-offs.' },
];

/**
 * Technology hubs. A hub page is generated at /<slug> for every technology
 * that has at least one published article. Article slugs must therefore not
 * collide with technology slugs (e.g. the Docker article is /docker-containers,
 * the Docker hub is /docker). The build fails loudly on any collision.
 */
export const technologies = [
  { slug: 'java', name: 'Java' },
  { slug: 'python', name: 'Python' },
  { slug: 'javascript', name: 'JavaScript' },
  { slug: 'typescript', name: 'TypeScript' },
  { slug: 'csharp', name: 'C#' },
  { slug: 'react', name: 'React' },
  { slug: 'angular', name: 'Angular' },
  { slug: 'nextjs', name: 'Next.js' },
  { slug: 'spring-boot', name: 'Spring Boot' },
  { slug: 'spring-security', name: 'Spring Security' },
  { slug: 'dotnet', name: '.NET' },
  { slug: 'rest-apis', name: 'REST APIs' },
  { slug: 'sql', name: 'SQL' },
  { slug: 'postgresql', name: 'PostgreSQL' },
  { slug: 'mysql', name: 'MySQL' },
  { slug: 'mongodb', name: 'MongoDB' },
  { slug: 'redis', name: 'Redis' },
  { slug: 'docker', name: 'Docker' },
  { slug: 'kubernetes', name: 'Kubernetes' },
  { slug: 'terraform', name: 'Terraform' },
  { slug: 'git', name: 'Git' },
  { slug: 'github-actions', name: 'GitHub Actions' },
  { slug: 'microservices', name: 'Microservices' },
  { slug: 'llms', name: 'LLMs' },
];

export const difficulties = ['beginner', 'intermediate', 'advanced'];

/** Prompt-library categories (engineering tasks, not topics). */
export const promptCategories = [
  { slug: 'code-review', name: 'Code Review' },
  { slug: 'feature-implementation', name: 'Feature Implementation' },
  { slug: 'bug-fix', name: 'Bug Fix' },
  { slug: 'refactoring', name: 'Refactoring' },
  { slug: 'testing', name: 'Testing' },
  { slug: 'security-review', name: 'Security Review' },
  { slug: 'performance-review', name: 'Performance Review' },
  { slug: 'api-review', name: 'API Review' },
  { slug: 'database-review', name: 'Database Review' },
  { slug: 'architecture-review', name: 'Architecture Review' },
  { slug: 'devops-review', name: 'DevOps Review' },
  { slug: 'infrastructure-review', name: 'Infrastructure Review' },
  { slug: 'ai-agent-review', name: 'AI Agent Review' },
  { slug: 'documentation', name: 'Documentation' },
  { slug: 'learning', name: 'Learning' },
  { slug: 'debugging', name: 'Debugging' },
];

/**
 * Slugs owned by hand-written HTML pages in src/pages. Content may not use them.
 * (Endpoints such as sitemap.xml or llms.txt have extensions, so /llms can
 * still be a hub page without colliding with /llms.txt.)
 */
export const reservedSlugs = [
  'index', 'knowledge', 'prompts', 'checklists', 'about', 'search', 'vibe-assist-demo',
  'copilot-agent', '404',
];

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function techSlug(name) {
  const t = technologies.find((x) => x.name.toLowerCase() === String(name).toLowerCase());
  return t ? t.slug : null;
}
