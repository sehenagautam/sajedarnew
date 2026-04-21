import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import slugify from 'slugify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

const now = new Date().toISOString();

const seedPosts = [
  {
    id: 'post_ai-nepal-roadmap',
    title: 'Nepal Pushes a Practical AI Roadmap for Public Services',
    slug: 'nepal-practical-ai-roadmap-public-services',
    excerpt:
      'New conversations around health, local government, and citizen support point toward a more grounded AI policy season.',
    content:
      'Nepal is moving from broad AI ambition toward practical public-service pilots. Experts say the strongest early wins will come from translation support, document processing, health triage, agriculture advisory systems, and local government help desks. The challenge is not only the technology. Teams will need clear data rules, accountable procurement, and training for civil servants before the tools can reach citizens safely.',
    category: 'AI',
    author: 'Sajedar Desk',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    tags: ['AI', 'Nepal', 'Policy'],
    featured: true,
    breaking: true,
    published: true,
    sourceName: 'Sajedar Analysis',
    sourceUrl: '',
    seoTitle: 'Nepal Pushes a Practical AI Roadmap for Public Services',
    seoDescription:
      'A Sajedar briefing on practical AI policy, public-service pilots, and responsible deployment in Nepal.',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'post_startup-cloud-costs',
    title: 'Startups Rethink Cloud Costs as AI Workloads Grow',
    slug: 'startups-rethink-cloud-costs-ai-workloads-grow',
    excerpt:
      'Founders are mixing managed AI APIs, smaller models, and tighter observability to keep experiments affordable.',
    content:
      'AI features can become expensive quickly when teams move from demos to real usage. Local founders are now tracking model calls like product metrics, caching repeated answers, and routing lighter tasks to smaller models. The pattern is simple: prototype fast, measure early, and reserve heavy compute for moments where users can actually feel the difference.',
    category: 'Startups',
    author: 'Sajedar Desk',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    tags: ['Startups', 'Cloud', 'AI'],
    featured: false,
    published: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'post_cybersecurity-schools',
    title: 'Schools Add Cyber Safety Lessons After New Phishing Wave',
    slug: 'schools-add-cyber-safety-lessons-after-phishing-wave',
    excerpt:
      'Digital literacy programs are expanding beyond password advice into scams, privacy, and safe AI use.',
    content:
      'A new wave of phishing messages has pushed schools to update digital safety lessons. Teachers are focusing on suspicious links, account recovery, private data, and the risks of sharing personal material with unknown services. Cybersecurity trainers say students should learn the habit of pausing before clicking, especially when a message creates urgency.',
    category: 'Security',
    author: 'Sajedar Desk',
    imageUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    tags: ['Security', 'Education'],
    featured: false,
    published: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'post_gadgets-ai-laptops',
    title: 'AI Laptops Arrive With Faster Local Tools and Better Battery Claims',
    slug: 'ai-laptops-arrive-local-tools-battery-claims',
    excerpt:
      'New chips promise offline writing help, image edits, and meeting summaries without sending every task to the cloud.',
    content:
      'Laptop makers are putting neural processors at the center of their 2026 lineups. The pitch is privacy, speed, and better battery life for everyday AI tasks. Buyers should still check real app support before upgrading, because the best hardware claims only matter when the software uses the new chips well.',
    category: 'Gadgets',
    author: 'Sajedar Desk',
    imageUrl:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    tags: ['Gadgets', 'AI', 'Hardware'],
    featured: true,
    published: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'post_payment-wallets',
    title: 'Digital Wallets Compete on Merchant Tools, Not Only Cashback',
    slug: 'digital-wallets-compete-merchant-tools-not-cashback',
    excerpt:
      'Small businesses want settlement visibility, simple records, and customer reminders more than short campaign offers.',
    content:
      'Cashback campaigns helped digital wallets grow, but merchants are now asking for sturdier tools. Better dashboards, tax-friendly reports, QR reliability, and customer follow-up features are becoming competitive advantages. Wallet teams that solve the boring daily problems may keep businesses longer than those that only run promotions.',
    category: 'Business',
    author: 'Sajedar Desk',
    imageUrl:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80',
    tags: ['Fintech', 'Business'],
    featured: false,
    published: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'post_app-review-productivity',
    title: 'Five Quiet Productivity Apps Worth Trying This Week',
    slug: 'five-quiet-productivity-apps-worth-trying-this-week',
    excerpt:
      'The best tools this week focus on notes, small-team planning, deep work timers, and clean personal dashboards.',
    content:
      'Productivity apps are often loud about being life-changing. The useful ones are quieter. This week, our picks focus on fast capture, searchable notes, fewer meetings, and personal dashboards that do not punish you for missing a day. The main test is whether the app disappears into your work instead of becoming extra work.',
    category: 'Apps',
    author: 'Sajedar Desk',
    imageUrl:
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80',
    tags: ['Apps', 'Productivity'],
    featured: false,
    published: true,
    createdAt: now,
    updatedAt: now
  }
];

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(POSTS_FILE);
  } catch {
    await fs.writeFile(POSTS_FILE, JSON.stringify(seedPosts, null, 2));
  }
}

async function readPosts() {
  await ensureDataFile();
  const raw = await fs.readFile(POSTS_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writePosts(posts) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
}

function toSlug(title, fallback = 'news-post') {
  const slug = slugify(title || fallback, {
    lower: true,
    strict: true,
    trim: true
  });

  return slug || fallback;
}

function readingMinutes(content = '') {
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function sanitizePostInput(input = {}, existing = {}) {
  const title = String(input.title ?? existing.title ?? '').trim();
  const content = String(input.content ?? existing.content ?? '').trim();
  const published = Boolean(input.published ?? existing.published ?? true);

  return {
    title,
    slug: String(input.slug ?? existing.slug ?? '').trim(),
    excerpt: String(input.excerpt ?? existing.excerpt ?? '').trim(),
    content,
    category: String(input.category ?? existing.category ?? 'AI').trim() || 'AI',
    author:
      String(input.author ?? existing.author ?? 'Sajedar Desk').trim() ||
      'Sajedar Desk',
    imageUrl: String(input.imageUrl ?? existing.imageUrl ?? '').trim(),
    tags: normalizeTags(input.tags ?? existing.tags ?? []),
    featured: Boolean(input.featured ?? existing.featured ?? false),
    breaking: Boolean(input.breaking ?? existing.breaking ?? false),
    published,
    sourceName: String(input.sourceName ?? existing.sourceName ?? '').trim(),
    sourceUrl: String(input.sourceUrl ?? existing.sourceUrl ?? '').trim(),
    seoTitle: String(input.seoTitle ?? existing.seoTitle ?? '').trim(),
    seoDescription: String(
      input.seoDescription ?? existing.seoDescription ?? ''
    ).trim(),
    publishedAt:
      String(input.publishedAt ?? existing.publishedAt ?? '').trim() ||
      (published ? existing.createdAt || new Date().toISOString() : ''),
    readingMinutes: readingMinutes(content)
  };
}

async function uniqueSlug(baseSlug, currentId = null) {
  const posts = await readPosts();
  let slug = baseSlug;
  let counter = 2;

  while (posts.some((post) => post.slug === slug && post.id !== currentId)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function listPosts(filters = {}) {
  const posts = await readPosts();
  const q = String(filters.q || '').trim().toLowerCase();
  const category = String(filters.category || '').trim().toLowerCase();
  const status = String(filters.status || 'all').trim().toLowerCase();

  return posts
    .filter((post) => filters.includeDrafts || post.published)
    .filter((post) => {
      if (status === 'published') {
        return post.published;
      }

      if (status === 'draft') {
        return !post.published;
      }

      if (status === 'featured') {
        return post.featured;
      }

      if (status === 'breaking') {
        return post.breaking;
      }

      return true;
    })
    .filter((post) => {
      if (!category || category === 'all') {
        return true;
      }
      return post.category.toLowerCase() === category;
    })
    .filter((post) => {
      if (!q) {
        return true;
      }

      return [
        post.title,
        post.excerpt,
        post.category,
        post.author,
        post.sourceName,
        post.tags.join(' ')
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => {
      if (a.breaking !== b.breaking) {
        return Number(b.breaking) - Number(a.breaking);
      }

      if (a.featured !== b.featured) {
        return Number(b.featured) - Number(a.featured);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

export async function getPostBySlug(slug, includeDrafts = false) {
  const posts = await readPosts();
  return posts.find(
    (post) => post.slug === slug && (includeDrafts || post.published)
  );
}

export async function getPostById(id) {
  const posts = await readPosts();
  return posts.find((post) => post.id === id);
}

export async function createPost(input) {
  const postInput = sanitizePostInput(input);

  if (!postInput.title || !postInput.content) {
    const error = new Error('Title and content are required.');
    error.status = 400;
    throw error;
  }

  const createdAt = new Date().toISOString();
  const baseSlug = toSlug(postInput.slug || postInput.title);
  const slug = await uniqueSlug(baseSlug);
  const post = {
    id: `post_${Date.now()}`,
    ...postInput,
    slug,
    excerpt:
      postInput.excerpt ||
      `${postInput.content.replace(/\s+/g, ' ').slice(0, 150)}...`,
    createdAt,
    updatedAt: createdAt
  };

  const posts = await readPosts();
  posts.unshift(post);
  await writePosts(posts);
  return post;
}

export async function updatePost(id, input) {
  const posts = await readPosts();
  const index = posts.findIndex((post) => post.id === id);

  if (index === -1) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  const existing = posts[index];
  const postInput = sanitizePostInput(input, existing);

  if (!postInput.title || !postInput.content) {
    const error = new Error('Title and content are required.');
    error.status = 400;
    throw error;
  }

  const baseSlug = toSlug(postInput.slug || postInput.title);
  const slug = await uniqueSlug(baseSlug, id);
  const updated = {
    ...existing,
    ...postInput,
    slug,
    updatedAt: new Date().toISOString()
  };

  posts[index] = updated;
  await writePosts(posts);
  return updated;
}

export async function deletePost(id) {
  const posts = await readPosts();
  const nextPosts = posts.filter((post) => post.id !== id);

  if (nextPosts.length === posts.length) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  await writePosts(nextPosts);
  return { id };
}

export async function listCategories() {
  const posts = await readPosts();
  return [...new Set(posts.map((post) => post.category))].sort();
}

function countBy(items) {
  return items.reduce((counts, item) => {
    if (!item) {
      return counts;
    }

    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

function topCounts(counts, limit = 5) {
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function getAdminStats() {
  const posts = await readPosts();
  const published = posts.filter((post) => post.published);
  const drafts = posts.filter((post) => !post.published);
  const tags = posts.flatMap((post) => post.tags || []);
  const recentlyUpdated = [...posts]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5)
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      updatedAt: post.updatedAt || post.createdAt,
      published: post.published
    }));

  return {
    total: posts.length,
    published: published.length,
    drafts: drafts.length,
    featured: posts.filter((post) => post.featured).length,
    breaking: posts.filter((post) => post.breaking).length,
    categories: [...new Set(posts.map((post) => post.category))].length,
    topCategories: topCounts(countBy(posts.map((post) => post.category))),
    topTags: topCounts(countBy(tags)),
    recentlyUpdated
  };
}
