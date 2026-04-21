import fallbackPosts from './fallback-posts.json';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'sajedar_admin_token';
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80';

function toQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return searchParams.toString() ? `?${searchParams}` : '';
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload?.message
        ? payload.message
        : 'Request failed.';
    throw new Error(message);
  }

  return payload;
}

function publishedFallbackPosts() {
  return fallbackPosts
    .filter((post) => post.published)
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt) -
        new Date(a.publishedAt || a.createdAt)
    );
}

function matchesSearch(post, query) {
  if (!query) {
    return true;
  }

  const target = [
    post.title,
    post.excerpt,
    post.content,
    post.category,
    post.sourceName,
    ...(post.tags || [])
  ]
    .join(' ')
    .toLowerCase();

  return target.includes(query.toLowerCase());
}

function fallbackPostList(params = {}) {
  return publishedFallbackPosts().filter((post) => {
    const categoryMatches =
      !params.category ||
      params.category === 'all' ||
      post.category.toLowerCase() === params.category.toLowerCase();

    return categoryMatches && matchesSearch(post, params.q || '');
  });
}

function fallbackPost(slug) {
  const post = publishedFallbackPosts().find((item) => item.slug === slug);

  if (!post) {
    throw new Error('Story not found.');
  }

  return post;
}

function fallbackCategories() {
  return [...new Set(publishedFallbackPosts().map((post) => post.category))];
}

async function publicRequest(fetcher, fallbackFactory) {
  try {
    return await fetcher();
  } catch (error) {
    console.warn(
      'Using bundled Sajedar stories because the live API is unavailable.',
      error
    );
    return fallbackFactory();
  }
}

export function imageUrl(url) {
  if (!url) {
    return FALLBACK_IMAGE;
  }

  return url.startsWith('/uploads/') ? `${API_BASE}${url}` : url;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  posts: (params = {}) =>
    publicRequest(
      () => request(`/api/posts${toQuery(params)}`),
      () => fallbackPostList(params)
    ),
  post: (slug) =>
    publicRequest(
      () => request(`/api/posts/${slug}`),
      () => fallbackPost(slug)
    ),
  categories: () =>
    publicRequest(
      () => request('/api/categories'),
      () => fallbackCategories()
    ),
  login: (payload) =>
    request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  adminStats: () =>
    request('/api/admin/stats', {
      headers: authHeaders()
    }),
  adminPosts: (params = {}) =>
    request(`/api/admin/posts${toQuery(params)}`, {
      headers: authHeaders()
    }),
  createPost: (payload) =>
    request('/api/admin/posts', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    }),
  updatePost: (id, payload) =>
    request(`/api/admin/posts/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    }),
  deletePost: (id) =>
    request(`/api/admin/posts/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    }),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return request('/api/admin/uploads', {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    });
  }
};
