import 'dart:convert';
import 'dart:ui';

import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

const String apiBaseUrl = String.fromEnvironment(
  'SAJEDAR_API_BASE',
  defaultValue: 'https://sajedar.com',
);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarBrightness: Brightness.light,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: AppColors.canvas,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const SajedarNewsApp());
}

class AppColors {
  static const Color ink = Color(0xFF111313);
  static const Color muted = Color(0xFF69706D);
  static const Color canvas = Color(0xFFF6F8F7);
  static const Color paper = Color(0xFFFFFFFF);
  static const Color green = Color(0xFF087A55);
  static const Color greenSoft = Color(0xFFE5F4ED);
  static const Color red = Color(0xFFC9263A);
  static const Color gold = Color(0xFFD7A526);
  static const Color line = Color(0xFFDCE4E0);
}

class SajedarNewsApp extends StatelessWidget {
  const SajedarNewsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const CupertinoApp(
      debugShowCheckedModeBanner: false,
      title: 'Sajedar AI News',
      theme: CupertinoThemeData(
        brightness: Brightness.light,
        primaryColor: AppColors.green,
        scaffoldBackgroundColor: AppColors.canvas,
        textTheme: CupertinoTextThemeData(
          textStyle: TextStyle(
            color: AppColors.ink,
            fontFamily: '.SF Pro Text',
            letterSpacing: 0,
          ),
        ),
      ),
      home: NewsHomeScreen(),
    );
  }
}

class NewsPost {
  const NewsPost({
    required this.id,
    required this.title,
    required this.slug,
    required this.excerpt,
    required this.content,
    required this.category,
    required this.author,
    required this.imageUrl,
    required this.tags,
    required this.featured,
    required this.breaking,
    required this.publishedAt,
    required this.sourceName,
    required this.sourceUrl,
    required this.readingMinutes,
  });

  final String id;
  final String title;
  final String slug;
  final String excerpt;
  final String content;
  final String category;
  final String author;
  final String imageUrl;
  final List<String> tags;
  final bool featured;
  final bool breaking;
  final DateTime publishedAt;
  final String sourceName;
  final String sourceUrl;
  final int readingMinutes;

  factory NewsPost.fromJson(Map<String, dynamic> json) {
    final rawTags = json['tags'];
    final tags = rawTags is List
        ? rawTags.map((tag) => tag.toString()).toList()
        : <String>[];

    return NewsPost(
      id: json['id']?.toString() ?? json['slug']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Untitled story',
      slug: json['slug']?.toString() ?? '',
      excerpt: json['excerpt']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      category: json['category']?.toString() ?? 'AI',
      author: json['author']?.toString() ?? 'Sajedar Desk',
      imageUrl: json['imageUrl']?.toString() ?? '',
      tags: tags,
      featured: json['featured'] == true,
      breaking: json['breaking'] == true,
      publishedAt:
          DateTime.tryParse(
            json['publishedAt']?.toString() ??
                json['createdAt']?.toString() ??
                '',
          ) ??
          DateTime.now(),
      sourceName: json['sourceName']?.toString() ?? '',
      sourceUrl: json['sourceUrl']?.toString() ?? '',
      readingMinutes: int.tryParse('${json['readingMinutes'] ?? 1}') ?? 1,
    );
  }
}

class NewsApi {
  const NewsApi();

  Future<List<NewsPost>> fetchPosts() async {
    final uri = Uri.parse(_join('/api/posts'));
    final response = await http.get(uri).timeout(const Duration(seconds: 8));

    if (response.statusCode != 200) {
      throw Exception('News service returned ${response.statusCode}');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! List) {
      throw Exception('Unexpected news response');
    }

    return decoded
        .whereType<Map<String, dynamic>>()
        .map(NewsPost.fromJson)
        .toList();
  }

  static String resolveImage(String imageUrl) {
    if (imageUrl.isEmpty) {
      return fallbackImage;
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    return _join(imageUrl);
  }

  static String _join(String path) {
    final base = apiBaseUrl.endsWith('/')
        ? apiBaseUrl.substring(0, apiBaseUrl.length - 1)
        : apiBaseUrl;
    final suffix = path.startsWith('/') ? path : '/$path';
    return '$base$suffix';
  }
}

const String fallbackImage =
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80';

class NewsHomeScreen extends StatefulWidget {
  const NewsHomeScreen({super.key});

  @override
  State<NewsHomeScreen> createState() => _NewsHomeScreenState();
}

class _NewsHomeScreenState extends State<NewsHomeScreen> {
  final NewsApi _api = const NewsApi();
  final TextEditingController _searchController = TextEditingController();
  List<NewsPost> _posts = fallbackPosts;
  String _selectedCategory = 'All';
  String _query = '';
  bool _loading = true;
  bool _usingSavedEdition = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadPosts() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final posts = await _api.fetchPosts();
      if (!mounted) return;
      setState(() {
        _posts = posts.isEmpty ? fallbackPosts : posts;
        _usingSavedEdition = posts.isEmpty;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _posts = fallbackPosts;
        _usingSavedEdition = true;
        _loading = false;
        _error = 'Showing saved edition until Sajedar is back online.';
      });
    }
  }

  List<String> get _categories {
    final values = _posts.map((post) => post.category).toSet().toList()..sort();
    return ['All', ...values];
  }

  List<NewsPost> get _visiblePosts {
    final query = _query.trim().toLowerCase();
    return _posts.where((post) {
      final matchesCategory =
          _selectedCategory == 'All' || post.category == _selectedCategory;
      final matchesQuery =
          query.isEmpty ||
          [
            post.title,
            post.excerpt,
            post.category,
            post.author,
            post.tags.join(' '),
          ].join(' ').toLowerCase().contains(query);
      return matchesCategory && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final posts = _visiblePosts;
    final lead = posts.isEmpty
        ? null
        : posts.firstWhere((post) => post.featured, orElse: () => posts.first);
    final latest = posts.where((post) => post.id != lead?.id).toList();
    final breaking = _posts.where((post) => post.breaking).take(3).toList();

    return CupertinoPageScaffold(
      backgroundColor: AppColors.canvas,
      child: SafeArea(
        bottom: false,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          slivers: [
            CupertinoSliverRefreshControl(onRefresh: _loadPosts),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _Masthead(),
                    const SizedBox(height: 22),
                    Text('Positive Nepali AI News', style: AppText.display),
                    const SizedBox(height: 8),
                    Text(
                      'Startups, apps, policy, and ecosystem signals from Nepal.',
                      style: AppText.bodyMuted,
                    ),
                    const SizedBox(height: 18),
                    CupertinoSearchTextField(
                      controller: _searchController,
                      placeholder: 'Search Sajedar',
                      borderRadius: BorderRadius.circular(18),
                      backgroundColor: AppColors.paper,
                      style: AppText.body,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 13,
                      ),
                      onChanged: (value) => setState(() => _query = value),
                    ),
                    const SizedBox(height: 16),
                    _CategoryRail(
                      categories: _categories,
                      selectedCategory: _selectedCategory,
                      onSelected: (category) {
                        setState(() => _selectedCategory = category);
                      },
                    ),
                    if (_loading) ...[
                      const SizedBox(height: 18),
                      const _LoadingPanel(),
                    ],
                    if (_error != null || _usingSavedEdition) ...[
                      const SizedBox(height: 18),
                      _StatusPill(
                        text: _error ?? 'Showing saved Sajedar edition.',
                      ),
                    ],
                    if (breaking.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      _BreakingPanel(posts: breaking),
                    ],
                    const SizedBox(height: 18),
                    if (lead != null) _LeadCard(post: lead),
                    const SizedBox(height: 28),
                    _SectionTitle(
                      eyebrow: 'Latest',
                      title: '${posts.length} stories',
                    ),
                  ],
                ),
              ),
            ),
            if (latest.isEmpty && !_loading)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: _EmptyPanel(),
                ),
              )
            else
              SliverList.separated(
                itemCount: latest.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  return Padding(
                    padding: EdgeInsets.fromLTRB(
                      20,
                      index == 0 ? 0 : 0,
                      20,
                      index == latest.length - 1 ? 36 : 0,
                    ),
                    child: _StoryTile(post: latest[index]),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _Masthead extends StatelessWidget {
  const _Masthead();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            color: AppColors.paper,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.line),
            boxShadow: const [
              BoxShadow(
                color: Color(0x14000000),
                blurRadius: 24,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(5),
            child: Image.asset('assets/logo-transparent.png'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Sajedar', style: AppText.brand),
              const SizedBox(height: 2),
              Text(_todayLabel(), style: AppText.caption),
            ],
          ),
        ),
        const _LiveDot(),
      ],
    );
  }
}

class _LiveDot extends StatelessWidget {
  const _LiveDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: AppColors.greenSoft,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFCBE7DB)),
      ),
      child: Row(
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: const BoxDecoration(
              color: AppColors.green,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text('Live', style: AppText.badge),
        ],
      ),
    );
  }
}

class _CategoryRail extends StatelessWidget {
  const _CategoryRail({
    required this.categories,
    required this.selectedCategory,
    required this.onSelected,
  });

  final List<String> categories;
  final String selectedCategory;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 42,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final category = categories[index];
          final selected = category == selectedCategory;
          return CupertinoButton(
            minimumSize: Size.zero,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            color: selected ? AppColors.ink : AppColors.paper,
            borderRadius: BorderRadius.circular(999),
            onPressed: () => onSelected(category),
            child: Text(
              category,
              style: AppText.chip.copyWith(
                color: selected ? AppColors.paper : AppColors.ink,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _BreakingPanel extends StatelessWidget {
  const _BreakingPanel({required this.posts});

  final List<NewsPost> posts;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Breaking', style: AppText.eyebrowRed),
          const SizedBox(height: 10),
          for (final post in posts)
            Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => _openArticle(context, post),
                child: Text(post.title, style: AppText.listHeadline),
              ),
            ),
        ],
      ),
    );
  }
}

class _LeadCard extends StatelessWidget {
  const _LeadCard({required this.post});

  final NewsPost post;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openArticle(context, post),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.paper,
          borderRadius: BorderRadius.circular(28),
          boxShadow: const [
            BoxShadow(
              color: Color(0x1C000000),
              blurRadius: 34,
              offset: Offset(0, 18),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1.18,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Hero(
                    tag: 'image-${post.id}',
                    child: _NetworkImage(
                      url: NewsApi.resolveImage(post.imageUrl),
                    ),
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0x00000000), Color(0x99000000)],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 18,
                    right: 18,
                    bottom: 18,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _MetaPill(text: post.category),
                        const SizedBox(height: 10),
                        Text(
                          post.title,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.leadOnImage,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(post.excerpt, style: AppText.bodyMuted),
                  const SizedBox(height: 14),
                  _StoryMeta(post: post),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StoryTile extends StatelessWidget {
  const _StoryTile({required this.post});

  final NewsPost post;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openArticle(context, post),
      child: _GlassPanel(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: SizedBox(
                width: 104,
                height: 104,
                child: _NetworkImage(url: NewsApi.resolveImage(post.imageUrl)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: _MetaPill(text: post.category, dark: false),
                      ),
                      if (post.breaking) ...[
                        const SizedBox(width: 6),
                        const _MetaPill(text: 'Breaking', danger: true),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    post.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.listHeadline,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    post.excerpt,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.caption,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ArticleScreen extends StatelessWidget {
  const ArticleScreen({required this.post, super.key});

  final NewsPost post;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.canvas,
      navigationBar: CupertinoNavigationBar(
        middle: Text(post.category),
        border: null,
        backgroundColor: AppColors.canvas.withValues(alpha: 0.82),
      ),
      child: SafeArea(
        bottom: false,
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: EdgeInsets.zero,
          children: [
            Hero(
              tag: 'image-${post.id}',
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(30),
                ),
                child: AspectRatio(
                  aspectRatio: 1.18,
                  child: _NetworkImage(
                    url: NewsApi.resolveImage(post.imageUrl),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 22, 22, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _MetaPill(text: post.category, dark: false),
                      if (post.breaking)
                        const _MetaPill(text: 'Breaking', danger: true),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(post.title, style: AppText.articleTitle),
                  const SizedBox(height: 12),
                  Text(post.excerpt, style: AppText.articleExcerpt),
                  const SizedBox(height: 16),
                  _StoryMeta(post: post),
                  const SizedBox(height: 26),
                  for (final paragraph in _paragraphs(post.content))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 18),
                      child: Text(paragraph, style: AppText.articleBody),
                    ),
                  if (post.sourceName.isNotEmpty || post.sourceUrl.isNotEmpty)
                    _SourceBox(post: post),
                  if (post.tags.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final tag in post.tags)
                          _MetaPill(text: tag, dark: false),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SourceBox extends StatelessWidget {
  const _SourceBox({required this.post});

  final NewsPost post;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Source', style: AppText.eyebrowGreen),
          const SizedBox(height: 8),
          Text(
            post.sourceName.isEmpty ? post.sourceUrl : post.sourceName,
            style: AppText.listHeadline,
          ),
          if (post.sourceUrl.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(post.sourceUrl, style: AppText.caption),
          ],
        ],
      ),
    );
  }
}

class _StoryMeta extends StatelessWidget {
  const _StoryMeta({required this.post});

  final NewsPost post;

  @override
  Widget build(BuildContext context) {
    return Text(
      '${post.author}  |  ${_shortDate(post.publishedAt)}  |  ${post.readingMinutes} min read',
      style: AppText.caption,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.eyebrow, required this.title});

  final String eyebrow;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(eyebrow, style: AppText.eyebrowGreen),
                const SizedBox(height: 4),
                Text(title, style: AppText.sectionTitle),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.text, this.dark = true, this.danger = false});

  final String text;
  final bool dark;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final background = danger
        ? AppColors.red
        : dark
        ? const Color(0xCC111313)
        : AppColors.greenSoft;
    final color = dark || danger ? AppColors.paper : AppColors.green;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: dark || danger
              ? const Color(0x22FFFFFF)
              : const Color(0xFFCBE7DB),
        ),
      ),
      child: Text(text, style: AppText.badge.copyWith(color: color)),
    );
  }
}

class _GlassPanel extends StatelessWidget {
  const _GlassPanel({
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          width: double.infinity,
          padding: padding,
          decoration: BoxDecoration(
            color: AppColors.paper.withValues(alpha: 0.86),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.line),
            boxShadow: const [
              BoxShadow(
                color: Color(0x10000000),
                blurRadius: 26,
                offset: Offset(0, 14),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

class _NetworkImage extends StatelessWidget {
  const _NetworkImage({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return Image.network(
      url,
      fit: BoxFit.cover,
      filterQuality: FilterQuality.high,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return const _ImagePlaceholder();
      },
      errorBuilder: (_, __, ___) => const _ImagePlaceholder(),
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.greenSoft,
      child: const Center(
        child: Icon(CupertinoIcons.sparkles, color: AppColors.green, size: 32),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Text(text, style: AppText.caption),
    );
  }
}

class _LoadingPanel extends StatelessWidget {
  const _LoadingPanel();

  @override
  Widget build(BuildContext context) {
    return const _GlassPanel(
      child: Row(
        children: [
          CupertinoActivityIndicator(),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Loading the latest Sajedar edition...',
              style: TextStyle(
                color: AppColors.muted,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyPanel extends StatelessWidget {
  const _EmptyPanel();

  @override
  Widget build(BuildContext context) {
    return const _GlassPanel(
      child: Text(
        'No stories match this view yet.',
        style: TextStyle(
          color: AppColors.muted,
          fontSize: 15,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class AppText {
  static const TextStyle brand = TextStyle(
    color: AppColors.ink,
    fontSize: 21,
    fontWeight: FontWeight.w900,
    letterSpacing: 0,
  );

  static const TextStyle display = TextStyle(
    color: AppColors.ink,
    fontSize: 38,
    height: 1.02,
    fontWeight: FontWeight.w900,
    letterSpacing: 0,
  );

  static const TextStyle sectionTitle = TextStyle(
    color: AppColors.ink,
    fontSize: 24,
    height: 1.08,
    fontWeight: FontWeight.w900,
    letterSpacing: 0,
  );

  static const TextStyle leadOnImage = TextStyle(
    color: AppColors.paper,
    fontSize: 27,
    height: 1.08,
    fontWeight: FontWeight.w900,
    letterSpacing: 0,
  );

  static const TextStyle articleTitle = TextStyle(
    color: AppColors.ink,
    fontSize: 34,
    height: 1.08,
    fontWeight: FontWeight.w900,
    letterSpacing: 0,
  );

  static const TextStyle articleExcerpt = TextStyle(
    color: AppColors.muted,
    fontSize: 18,
    height: 1.55,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
  );

  static const TextStyle articleBody = TextStyle(
    color: AppColors.ink,
    fontSize: 17,
    height: 1.65,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
  );

  static const TextStyle body = TextStyle(
    color: AppColors.ink,
    fontSize: 16,
    height: 1.45,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
  );

  static const TextStyle bodyMuted = TextStyle(
    color: AppColors.muted,
    fontSize: 16,
    height: 1.48,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
  );

  static const TextStyle listHeadline = TextStyle(
    color: AppColors.ink,
    fontSize: 17,
    height: 1.25,
    fontWeight: FontWeight.w800,
    letterSpacing: 0,
  );

  static const TextStyle caption = TextStyle(
    color: AppColors.muted,
    fontSize: 13,
    height: 1.35,
    fontWeight: FontWeight.w700,
    letterSpacing: 0,
  );

  static const TextStyle chip = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w800,
    letterSpacing: 0,
  );

  static const TextStyle badge = TextStyle(
    color: AppColors.green,
    fontSize: 12,
    fontWeight: FontWeight.w900,
    letterSpacing: 0,
  );

  static const TextStyle eyebrowGreen = TextStyle(
    color: AppColors.green,
    fontSize: 12,
    fontWeight: FontWeight.w900,
    letterSpacing: 0,
  );

  static const TextStyle eyebrowRed = TextStyle(
    color: AppColors.red,
    fontSize: 12,
    fontWeight: FontWeight.w900,
    letterSpacing: 0,
  );
}

void _openArticle(BuildContext context, NewsPost post) {
  Navigator.of(
    context,
  ).push(CupertinoPageRoute<void>(builder: (_) => ArticleScreen(post: post)));
}

List<String> _paragraphs(String content) {
  return content
      .split('\n')
      .map((line) => line.trim())
      .where((line) => line.isNotEmpty)
      .toList();
}

String _todayLabel() {
  final now = DateTime.now();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[now.month - 1]} ${now.day}, ${now.year}';
}

String _shortDate(DateTime value) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[value.month - 1]} ${value.day}, ${value.year}';
}

final List<NewsPost> fallbackPosts = [
  NewsPost(
    id: 'policy-2082',
    title: 'National AI Policy 2082 gives Nepal a clear starting point',
    slug: 'national-ai-policy-2082-gives-nepal-clear-starting-point',
    excerpt:
        'Nepal now has a formal policy base for responsible AI growth, public sector use, and startup support.',
    content:
        'Nepal has taken an important step by giving artificial intelligence a formal place in national planning. The National Artificial Intelligence Policy, 2082 gives public agencies, founders, researchers, and investors a shared direction for responsible AI growth.\n\nThe policy points toward regulation, data governance, research capacity, digital infrastructure, and startup support. That mix matters because AI is not only a software trend. It needs trust, skilled people, useful public data, secure systems, and patient coordination.\n\nThe next test is implementation. Nepal still needs better procurement, safer data systems, local technical capacity, and practical pilots in sectors like health, education, agriculture, tourism, finance, and local government. Still, the signal is positive. A serious AI ecosystem needs a policy base, and Nepal now has one to build from.',
    category: 'Policy',
    author: 'Sajedar Desk',
    imageUrl:
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    tags: const ['AI Policy', 'Nepal', 'Governance'],
    featured: true,
    breaking: true,
    publishedAt: DateTime(2026, 4, 17),
    sourceName: 'Sajedar saved edition',
    sourceUrl: '',
    readingMinutes: 2,
  ),
  NewsPost(
    id: 'ai-summit',
    title: 'AI Summit Nepal 2026 turns policy talk into ecosystem momentum',
    slug: 'ai-summit-nepal-2026-ecosystem-momentum',
    excerpt:
        'The Lalitpur summit brought policy, startups, compute, finance, and energy into one practical conversation.',
    content:
        'AI Summit Nepal 2026 showed that Nepal wants to move beyond scattered AI curiosity and into ecosystem building. The Lalitpur event brought together founders, policymakers, business leaders, academic voices, and international partners.\n\nThe agenda was encouraging because it covered more than apps. Nepal discussed compute infrastructure, society, the new economy, energy, and finance. These are the real foundations that decide whether AI can become useful at national scale.\n\nFor startups, the value is visibility. When builders can meet policy leaders, infrastructure providers, investors, and enterprise buyers in the same room, ideas have a better chance of becoming pilots and companies.',
    category: 'Ecosystem',
    author: 'Sajedar Desk',
    imageUrl:
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    tags: const ['AI Summit', 'Lalitpur', 'Startups'],
    featured: true,
    breaking: false,
    publishedAt: DateTime(2026, 4, 17),
    sourceName: 'Sajedar saved edition',
    sourceUrl: '',
    readingMinutes: 2,
  ),
  NewsPost(
    id: 'exports',
    title: 'Nepal sets a five year vision for AI exports and compute power',
    slug: 'nepal-five-year-vision-ai-exports-compute-power',
    excerpt:
        'A national technology vision names AI services, computing power, data centres, and IT exports as priorities.',
    content:
        'Nepal has started describing technology as a strategic industry, not only a support sector. The most ambitious part is the five year vision to export AI services and computing power.\n\nThat goal will require more than enthusiasm. Nepal will need dependable data centres, better broadband, secure enterprise systems, strong policy execution, and export ready companies. The good news is that the country already has software talent, remote work experience, digital payment adoption, and a clean energy story that can matter in the data centre age.\n\nIf Nepal connects those strengths carefully, AI exports can become part of a broader digital economy story. The opportunity is real, but the work has to be disciplined.',
    category: 'Policy',
    author: 'Sajedar Desk',
    imageUrl:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    tags: const ['AI Exports', 'Compute', 'Digital Nepal'],
    featured: false,
    breaking: false,
    publishedAt: DateTime(2026, 4, 17),
    sourceName: 'Sajedar saved edition',
    sourceUrl: '',
    readingMinutes: 2,
  ),
  NewsPost(
    id: 'startups',
    title: 'Nepal AI startup scene is small, useful, and getting more serious',
    slug: 'nepal-ai-startup-scene-small-useful-serious',
    excerpt:
        'New AI products in cybersecurity and local SEO are appearing beside education, robotics, and payment leaders.',
    content:
        'Nepal AI startups are beginning to look more practical. The strongest sign is not hype. It is the variety of problems founders are trying to solve.\n\nNewer products are appearing in areas like cybersecurity, local SEO, communication, and workflow automation. Older builders are also important. Fusemachines keeps investing in AI education and enterprise AI. Paaila Technology has shown local robotics and language technology through projects like Pari and Ginger. Digital payment platforms have helped normalize everyday digital behaviour across the country.\n\nThe ecosystem is still small, but it is becoming more useful. The next step is helping these teams find customers, capital, mentors, secure infrastructure, and policy support without forcing them to leave Nepal to grow.',
    category: 'Startups',
    author: 'Sajedar Desk',
    imageUrl:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    tags: const ['Startups', 'NeuraGuard', 'Fusemachines'],
    featured: false,
    breaking: false,
    publishedAt: DateTime(2026, 4, 17),
    sourceName: 'Sajedar saved edition',
    sourceUrl: '',
    readingMinutes: 2,
  ),
  NewsPost(
    id: 'ting-ting',
    title: 'Ting Ting gives Nepali AI a proud global stage in Qatar',
    slug: 'ting-ting-nepali-ai-global-stage-qatar',
    excerpt:
        'The AI communication startup gave Nepal a visible place at a major global technology gathering.',
    content:
        'Ting Ting has given Nepal AI a proud international signal. A Nepali AI communication startup appearing at a global technology gathering matters because it shows that companies from smaller markets can still build for serious stages.\n\nCommunication AI is a difficult space. Voice, intent, language, accents, and local context are hard even in large markets. For Nepali and other lower resource languages, the challenge is deeper. That makes a Nepali built communication product more than a business idea. It is a statement about building for users who are often ignored by mainstream AI systems.\n\nThe biggest takeaway is confidence. If a company can build at home, prove its system, and stand in front of international partners, Nepal AI becomes easier to believe.',
    category: 'Startups',
    author: 'Sajedar Desk',
    imageUrl:
        'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80',
    tags: const ['Ting Ting', 'Web Summit Qatar', 'Nepali AI'],
    featured: false,
    breaking: false,
    publishedAt: DateTime(2026, 4, 17),
    sourceName: 'Sajedar saved edition',
    sourceUrl: '',
    readingMinutes: 2,
  ),
];
