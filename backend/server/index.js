import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loginHandler, requireAdmin } from './auth.js';
import {
  createPost,
  deletePost,
  getAdminStats,
  getPostById,
  getPostBySlug,
  listCategories,
  listPosts,
  updatePost
} from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');
const distDir = path.resolve(rootDir, '../frontend/dist');

fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const port = process.env.PORT || 5050;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/(^-|-$)/g, '');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image uploads are allowed.'));
    }
  }
});

app.use(
  cors({
    origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'Sajedar AI News API' });
});

app.get('/api/categories', async (_req, res, next) => {
  try {
    res.json(await listCategories());
  } catch (error) {
    next(error);
  }
});

app.get('/api/posts', async (req, res, next) => {
  try {
    const posts = await listPosts({
      includeDrafts: false,
      q: req.query.q,
      category: req.query.category
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

app.get('/api/posts/:slug', async (req, res, next) => {
  try {
    const post = await getPostBySlug(req.params.slug, false);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.json(post);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/login', loginHandler);

app.get('/api/admin/stats', requireAdmin, async (_req, res, next) => {
  try {
    res.json(await getAdminStats());
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/posts', requireAdmin, async (req, res, next) => {
  try {
    res.json(
      await listPosts({
        includeDrafts: true,
        q: req.query.q,
        category: req.query.category,
        status: req.query.status
      })
    );
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.json(post);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/posts', requireAdmin, async (req, res, next) => {
  try {
    const post = await createPost(req.body);
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    res.json(await updatePost(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    res.json(await deletePost(req.params.id));
  } catch (error) {
    next(error);
  }
});

app.post(
  '/api/admin/uploads',
  requireAdmin,
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    return res.status(201).json({
      url: `/uploads/${req.file.filename}`
    });
  }
);

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = status === 500 ? 'Something went wrong.' : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Sajedar API running on http://localhost:${port}`);
});
