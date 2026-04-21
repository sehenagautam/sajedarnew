import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom';
import { api, clearToken, getToken, imageUrl, setToken } from './api.js';

const defaultCategories = ['AI', 'Startups', 'Security', 'Gadgets', 'Business', 'Apps'];

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'AI',
  author: 'Sajedar Desk',
  imageUrl: '',
  tags: '',
  sourceName: '',
  sourceUrl: '',
  seoTitle: '',
  seoDescription: '',
  featured: false,
  breaking: false,
  published: true
};

const adminStatusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Featured', value: 'featured' },
  { label: 'Breaking', value: 'breaking' }
];

function formatDate(value) {
  if (!value) {
    return 'Unpublished';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function todayLabel() {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Header({ categories }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/');
  }

  return (
    <header className="site-header">
      <div className="top-strip">
        <span>{todayLabel()}</span>
        <span>AI, technology, startups, security, and digital business</span>
      </div>

      <div className="brand-row">
        <Link className="brand" to="/" aria-label="Sajedar AI News home">
          <img src="/logo-transparent.png" alt="Sajedar AI News" />
          <span>
            <strong>Sajedar</strong>
            <small>AI News</small>
          </span>
        </Link>

        <form className="search" onSubmit={handleSubmit}>
          <label htmlFor="site-search">Search news</label>
          <input
            id="site-search"
            type="search"
            placeholder="Search stories, companies, policy"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <nav className="category-nav" aria-label="News categories">
        <NavLink to="/" end>
          Home
        </NavLink>
        {categories.map((category) => (
          <NavLink key={category} to={`/category/${encodeURIComponent(category)}`}>
            {category}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

function StoryImage({ post, className = '' }) {
  return (
    <img
      className={className}
      src={imageUrl(post.imageUrl)}
      alt=""
      loading="lazy"
    />
  );
}

function Meta({ post, showAuthor = false }) {
  return (
    <p className="meta">
      <span>{post.category}</span>
      {showAuthor && <span>By {post.author}</span>}
      <span>{formatDate(post.publishedAt || post.createdAt)}</span>
      <span>{post.readingMinutes || 1} min read</span>
    </p>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="section-heading">
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function BulletinBar({ posts, label = 'Breaking' }) {
  if (!posts.length) {
    return null;
  }

  return (
    <section className="bulletin page-shell" aria-label="Breaking stories">
      <strong>{label}</strong>
      <div>
        {posts.map((post) => (
          <Link key={post.id} to={`/news/${post.slug}`}>
            {post.title}
          </Link>
        ))}
      </div>
    </section>
  );
}

function LeadStory({ post }) {
  if (!post) {
    return null;
  }

  return (
    <article className="lead-story">
      <Link to={`/news/${post.slug}`}>
        <StoryImage post={post} />
        <div className="lead-copy">
          {post.breaking && <span className="story-flag">Breaking</span>}
          <Meta post={post} showAuthor />
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
        </div>
      </Link>
    </article>
  );
}

function StoryCard({ post, compact = false, quiet = false }) {
  const className = ['story-card', compact && 'compact', quiet && 'quiet']
    .filter(Boolean)
    .join(' ');

  return (
    <article className={className}>
      <Link to={`/news/${post.slug}`}>
        {!quiet && <StoryImage post={post} />}
        <div>
          <Meta post={post} />
          <h3>{post.title}</h3>
          {!compact && <p>{post.excerpt}</p>}
        </div>
      </Link>
    </article>
  );
}

function LatestList({ posts }) {
  return (
    <aside className="latest-list">
      <SectionHeading eyebrow="Latest" title="Fresh updates" />
      {posts.map((post, index) => (
        <Link key={post.id} className="latest-item" to={`/news/${post.slug}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div>
            <strong>{post.title}</strong>
            <small>{post.category}</small>
          </div>
        </Link>
      ))}
    </aside>
  );
}

function InsightPanel() {
  return (
    <section className="insight-panel">
      <p>Briefing</p>
      <h2>What matters now</h2>
      <strong>
        AI adoption is moving from experiments into budgets, staff training,
        compliance, and customer support.
      </strong>
      <span>
        The strongest teams will make useful systems reliable enough to trust.
      </span>
    </section>
  );
}

function HomePage({ category }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .posts({ q: query, category })
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [category, query]);

  const lead = posts.find((post) => post.featured) || posts[0];
  const remaining = posts.filter((post) => post.id !== lead?.id);
  const sideStories = remaining.slice(0, 2);
  const latest = posts.slice(0, 6);
  const breakingStories = posts.filter((post) => post.breaking).slice(0, 3);
  const categoryGroups = useMemo(() => {
    return posts.reduce((groups, post) => {
      groups[post.category] ||= [];
      groups[post.category].push(post);
      return groups;
    }, {});
  }, [posts]);

  return (
    <main>
      <BulletinBar
        posts={breakingStories.length ? breakingStories : latest.slice(0, 2)}
        label={breakingStories.length ? 'Breaking' : 'Latest'}
      />

      <section className="front-grid page-shell">
        <div>
          <SectionHeading
            eyebrow={category ? `${category} desk` : query ? 'Search results' : 'Top story'}
            title={
              query
                ? `News matching "${query}"`
                : category
                  ? `${category} headlines`
                  : 'Today in AI and technology'
            }
          />
          {loading && <p className="status">Loading news...</p>}
          {error && <p className="status error">{error}</p>}
          {!loading && !error && posts.length === 0 && (
            <p className="status">No news found.</p>
          )}
          <LeadStory post={lead} />
        </div>

        <aside className="front-rail">
          {sideStories.map((post) => (
            <StoryCard key={post.id} post={post} compact />
          ))}
          <InsightPanel />
        </aside>
      </section>

      {remaining.length > 0 && (
        <section className="page-shell news-strip">
          <SectionHeading eyebrow="Editors' desk" title="Stories worth your time" />
          <div className="card-grid">
            {remaining.slice(2, 8).map((post) => (
              <StoryCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="page-shell split-section">
        <LatestList posts={latest} />
        <div className="market-note">
          <p>Signal</p>
          <h2>Digital Nepal watch</h2>
          <span>
            Follow the moves shaping AI policy, startup finance, cloud spending,
            cybersecurity readiness, and everyday technology.
          </span>
        </div>
      </section>

      {!category && !query && (
        <section className="page-shell category-sections">
          {Object.entries(categoryGroups)
            .slice(0, 4)
            .map(([group, groupPosts]) => (
              <div className="category-block" key={group}>
                <SectionHeading
                  eyebrow={group}
                  title={`${group} updates`}
                  action={<Link to={`/category/${encodeURIComponent(group)}`}>View all</Link>}
                />
                <div className="mini-grid">
                  {groupPosts.slice(0, 3).map((post) => (
                    <StoryCard key={post.id} post={post} compact quiet />
                  ))}
                </div>
              </div>
            ))}
        </section>
      )}
    </main>
  );
}

function CategoryPage() {
  const { category } = useParams();
  return <HomePage category={decodeURIComponent(category)} />;
}

function ArticlePage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .post(slug)
      .then((payload) => {
        setPost(payload);
        document.title = `${payload.seoTitle || payload.title} | Sajedar AI News`;
        return api.posts({ category: payload.category });
      })
      .then((payload) =>
        setRelated(payload.filter((item) => item.slug !== slug).slice(0, 3))
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    return () => {
      document.title = 'Sajedar AI News';
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="status">Loading story...</p>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="page-shell">
        <p className="status error">{error || 'Story not found.'}</p>
      </main>
    );
  }

  return (
    <main>
      <article className="article page-shell">
        <Meta post={post} showAuthor />
        <h1>{post.title}</h1>
        <p className="article-excerpt">{post.excerpt}</p>
        <StoryImage post={post} className="article-image" />
        <div className="article-body">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={`${post.id}-${index}`}>{paragraph}</p>
          ))}
        </div>
        {(post.sourceName || post.sourceUrl) && (
          <p className="source-line">
            Source:{' '}
            {post.sourceUrl ? (
              <a href={post.sourceUrl} target="_blank" rel="noreferrer">
                {post.sourceName || post.sourceUrl}
              </a>
            ) : (
              post.sourceName
            )}
          </p>
        )}
        <div className="tag-row">
          {(post.tags || []).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="page-shell news-strip">
          <SectionHeading eyebrow="Keep reading" title={`More from ${post.category}`} />
          <div className="card-grid three">
            {related.map((item) => (
              <StoryCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Login({ onLoggedIn }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const payload = await api.login(form);
      setToken(payload.token);
      onLoggedIn();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <form className="login-panel" onSubmit={handleSubmit}>
        <img src="/logo-transparent.png" alt="Sajedar AI News" />
        <h1>Newsroom access</h1>
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={updateField}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={updateField}
          />
        </label>
        {message && <p className="status error">{message}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
    </div>
  );
}

function AdminPage() {
  const [tokenState, setTokenState] = useState(getToken());
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState(defaultCategories);
  const [filters, setFilters] = useState({ q: '', status: 'all', category: 'all' });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function loadDashboard(nextFilters = filters) {
    return Promise.all([
      api.adminPosts(nextFilters),
      api.adminStats(),
      api.categories()
    ])
      .then(([postPayload, statsPayload, categoryPayload]) => {
        setPosts(postPayload);
        setStats(statsPayload);
        if (categoryPayload.length) {
          setCategories(categoryPayload);
        }
      })
      .catch((error) => {
        if (
          error.message.includes('access required') ||
          error.message.includes('login')
        ) {
          clearToken();
          setTokenState(null);
        }
        setMessage(error.message);
      });
  }

  useEffect(() => {
    if (tokenState) {
      loadDashboard();
    }
  }, [tokenState, filters.q, filters.status, filters.category]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  }

  function startEdit(post) {
    setEditingId(post.id);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'AI',
      author: post.author || 'Sajedar Desk',
      imageUrl: post.imageUrl || '',
      tags: (post.tags || []).join(', '),
      sourceName: post.sourceName || '',
      sourceUrl: post.sourceUrl || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      featured: Boolean(post.featured),
      breaking: Boolean(post.breaking),
      published: Boolean(post.published)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const payload = {
      ...form,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    };

    try {
      if (editingId) {
        await api.updatePost(editingId, payload);
        setMessage('Post updated.');
      } else {
        await api.createPost(payload);
        setMessage(form.published ? 'Post published.' : 'Draft saved.');
      }
      resetForm();
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function duplicatePost(post) {
    setBusy(true);
    setMessage('');

    try {
      await api.createPost({
        ...post,
        title: `${post.title} Copy`,
        slug: '',
        published: false,
        featured: false,
        breaking: false
      });
      setMessage('Draft copy created.');
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removePost(post) {
    if (!window.confirm(`Delete "${post.title}"?`)) {
      return;
    }

    try {
      await api.deletePost(post.id);
      setMessage('Post deleted.');
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setMessage('Uploading image...');

    try {
      const payload = await api.uploadImage(file);
      setForm((current) => ({ ...current, imageUrl: payload.url }));
      setMessage('Image uploaded.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    clearToken();
    setTokenState(null);
  }

  if (!tokenState) {
    return <Login onLoggedIn={() => setTokenState(getToken())} />;
  }

  return (
    <main className="admin-dashboard">
      <div className="admin-top">
        <div>
          <p>Newsroom</p>
          <h1>Manage Sajedar news</h1>
        </div>
        <button type="button" onClick={logout}>
          Logout
        </button>
      </div>

      <section className="stats-grid">
        <StatCard label="Total posts" value={stats?.total} />
        <StatCard label="Published" value={stats?.published} />
        <StatCard label="Drafts" value={stats?.drafts} />
        <StatCard label="Featured" value={stats?.featured} />
        <StatCard label="Breaking" value={stats?.breaking} />
      </section>

      <section className="admin-grid">
        <form className="post-form" onSubmit={handleSubmit}>
          <div className="form-title-row">
            <h2>{editingId ? 'Edit post' : 'Create post'}</h2>
            {editingId && (
              <button type="button" className="ghost-button" onClick={resetForm}>
                New post
              </button>
            )}
          </div>

          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              required
            />
          </label>

          <div className="two-fields">
            <label>
              Category
              <input
                name="category"
                value={form.category}
                onChange={updateField}
                list="admin-categories"
                required
              />
              <datalist id="admin-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>
            <label>
              Author
              <input name="author" value={form.author} onChange={updateField} />
            </label>
          </div>

          <label>
            Slug
            <input
              name="slug"
              value={form.slug}
              onChange={updateField}
              placeholder="Leave blank to generate"
            />
          </label>

          <label>
            Excerpt
            <textarea
              name="excerpt"
              rows="3"
              value={form.excerpt}
              onChange={updateField}
            />
          </label>

          <label>
            Content
            <textarea
              name="content"
              rows="10"
              value={form.content}
              onChange={updateField}
              required
            />
          </label>

          <div className="two-fields">
            <label>
              Source name
              <input
                name="sourceName"
                value={form.sourceName}
                onChange={updateField}
                placeholder="Original report, agency, or source"
              />
            </label>
            <label>
              Source URL
              <input
                name="sourceUrl"
                value={form.sourceUrl}
                onChange={updateField}
                placeholder="https://..."
              />
            </label>
          </div>

          <label>
            Image URL
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={updateField}
              placeholder="https://..."
            />
          </label>

          {form.imageUrl && (
            <img className="image-preview" src={imageUrl(form.imageUrl)} alt="" />
          )}

          <label className="upload-line">
            Upload image
            <input type="file" accept="image/*" onChange={handleUpload} />
          </label>

          <label>
            Tags
            <input
              name="tags"
              value={form.tags}
              onChange={updateField}
              placeholder="AI, Nepal, Startups"
            />
          </label>

          <div className="two-fields">
            <label>
              SEO title
              <input
                name="seoTitle"
                value={form.seoTitle}
                onChange={updateField}
                placeholder="Optional search title"
              />
            </label>
            <label>
              SEO description
              <input
                name="seoDescription"
                value={form.seoDescription}
                onChange={updateField}
                placeholder="Optional search description"
              />
            </label>
          </div>

          <div className="check-row">
            <label>
              <input
                name="featured"
                type="checkbox"
                checked={form.featured}
                onChange={updateField}
              />
              Featured
            </label>
            <label>
              <input
                name="breaking"
                type="checkbox"
                checked={form.breaking}
                onChange={updateField}
              />
              Breaking
            </label>
            <label>
              <input
                name="published"
                type="checkbox"
                checked={form.published}
                onChange={updateField}
              />
              Published
            </label>
          </div>

          {message && <p className="status">{message}</p>}
          <button type="submit" disabled={busy}>
            {busy ? 'Saving...' : editingId ? 'Update post' : 'Save post'}
          </button>
        </form>

        <section className="admin-list">
          <div className="list-title-row">
            <h2>All posts</h2>
            <button type="button" className="ghost-button" onClick={() => loadDashboard()}>
              Refresh
            </button>
          </div>

          <div className="admin-filters">
            <label>
              Search
              <input
                name="q"
                value={filters.q}
                onChange={updateFilter}
                placeholder="Title, category, tag, source"
              />
            </label>
            <label>
              Status
              <select name="status" value={filters.status} onChange={updateFilter}>
                {adminStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select name="category" value={filters.category} onChange={updateFilter}>
                <option value="all">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {posts.map((post) => (
            <article key={post.id} className="admin-post">
              <img src={imageUrl(post.imageUrl)} alt="" />
              <div>
                <p className="meta">
                  <span>{post.category}</span>
                  <span>{post.published ? 'Published' : 'Draft'}</span>
                  {post.featured && <span>Featured</span>}
                  {post.breaking && <span>Breaking</span>}
                </p>
                <h3>{post.title}</h3>
                <small>Updated {formatDate(post.updatedAt || post.createdAt)}</small>
                <div className="admin-actions">
                  {post.published && <Link to={`/news/${post.slug}`}>View</Link>}
                  <button type="button" onClick={() => startEdit(post)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => duplicatePost(post)}>
                    Duplicate
                  </button>
                  <button type="button" onClick={() => removePost(post)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid">
        <div>
          <img src="/logo-transparent.png" alt="Sajedar AI News" />
          <p>Sharp coverage of AI, startups, security, gadgets, apps, and digital business.</p>
        </div>
        <div>
          <strong>Newsroom</strong>
          <Link to="/category/AI">AI</Link>
          <Link to="/category/Startups">Startups</Link>
          <Link to="/category/Security">Security</Link>
        </div>
        <div>
          <strong>Sajedar.com</strong>
          <Link to="/category/Gadgets">Gadgets</Link>
          <Link to="/category/Business">Business</Link>
          <Link to="/category/Apps">Apps</Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => {
    api
      .categories()
      .then((payload) => {
        if (payload.length) {
          setCategories(payload);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <ScrollToTop />
      <Header categories={categories} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/news/:slug" element={<ArticlePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Footer />
    </>
  );
}
