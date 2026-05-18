import { Injectable, signal, computed } from '@angular/core';
import { Video, YouTubeSubscription, FeedVideo, HistoryItem, WeTubeTab, ContentItem } from './wetube.model';

@Injectable({
  providedIn: 'root'
})
export class WeTubeService {
  // Core State
  readonly videos = signal<Video[]>([]);
  readonly subscriptions = signal<YouTubeSubscription[]>([]);
  readonly feedVideos = signal<FeedVideo[]>([]);
  readonly trendingVideos = signal<FeedVideo[]>([]);
  readonly searchResults = signal<FeedVideo[]>([]);
  readonly shortsFeed = signal<FeedVideo[]>([]);
  
  // UI State
  readonly activeTab = signal<WeTubeTab>('home');
  readonly activeCategory = signal<string>('الكل');
  readonly searchQuery = signal<string>('');
  readonly isSearching = signal<boolean>(false);
  readonly isFeedLoading = signal<boolean>(false);
  readonly isShortsLoading = signal<boolean>(false);
  
  // Active Content Context
  readonly activeChannel = signal<{ id: string, name: string, avatar?: string } | null>(null);
  readonly channelVideos = signal<FeedVideo[]>([]);
  
  // History State
  readonly history = signal<HistoryItem[]>([]);
  readonly remoteHistory = signal<FeedVideo[]>([]);

  constructor() {
    // Inject Dummy Data for UI Verification
    this.videos.set([
      {
        id: '1',
        title: 'بناء نظام الذكاء الاصطناعي الخاص بك من الصفر',
        author: 'Nexus Engineering',
        authorId: 'ch1',
        source: 'platform',
        time: 'منذ ساعتين',
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
        channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus',
        category: 'تكنولوجيا',
        status: 'published'
      },
      {
        id: '2',
        title: 'أفضل ممارسات Angular 21 مع Signals',
        author: 'Code Master',
        authorId: 'ch2',
        source: 'platform',
        time: 'منذ يومين',
        thumbnail: 'https://images.unsplash.com/photo-1627398240309-08a85c7d9b04?auto=format&fit=crop&q=80&w=800',
        channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Code',
        category: 'برمجة',
        status: 'published'
      },
      {
        id: '3',
        title: 'استعراض أداء Nexus Video Player الجديد',
        author: 'Nexus OS',
        authorId: 'ch3',
        source: 'youtube',
        time: 'منذ 5 ساعات',
        thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
        channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OS',
        category: 'تكنولوجيا',
        status: 'published'
      },
      {
        id: '4',
        title: 'ملخص مؤتمر التكنولوجيا لعام 2026',
        author: 'Tech News',
        authorId: 'ch4',
        source: 'youtube',
        time: 'منذ أسبوع',
        thumbnail: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&q=80&w=800',
        channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tech',
        category: 'أخبار',
        status: 'published'
      },
      {
        id: '5',
        title: 'تطوير الألعاب المستقلة باستخدام Unity',
        author: 'Game Devs',
        authorId: 'ch5',
        source: 'platform',
        time: 'منذ 3 أسابيع',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
        channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Game',
        category: 'ألعاب',
        status: 'published'
      }
    ]);

    this.subscriptions.set([
      { id: 'sub1', channelId: 'ch1', channelTitle: 'Nexus Engineering', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus' },
      { id: 'sub2', channelId: 'ch2', channelTitle: 'Code Master', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Code' }
    ]);
  }

  // Computed State: allHomeContent
  readonly allHomeContent = computed(() => {
    const searchRes = this.searchResults();
    const query = this.searchQuery();
    const subs = this.subscriptions();

    if (searchRes.length > 0 && query) {
      return searchRes.map(v => {
        const sub = subs.find(s => s.channelId === v.authorId);
        return { ...v, channelAvatar: v.channelAvatar || sub?.avatarUrl };
      });
    }

    const channel = this.activeChannel();
    if (channel) {
      return this.channelVideos().map(v => {
        const sub = subs.find(s => s.channelId === v.authorId);
        return { ...v, channelAvatar: v.channelAvatar || channel.avatar || sub?.avatarUrl };
      });
    }

    // Default combinations (Platform + Subscriptions Feed)
    const platformVids = this.videos().filter(v => v.status === 'published').map(v => ({
      ...v,
      source: v.source || 'platform',
      channelAvatar: v.channelAvatar || subs.find(s => s.channelId === v.authorId)?.avatarUrl
    }));

    const feedVids = this.feedVideos().map(v => ({
      ...v,
      source: 'youtube' as const,
      time: 'حديثاً',
      channelAvatar: v.channelAvatar || subs.find(s => s.channelId === v.authorId)?.avatarUrl
    }));

    const trendingVids = this.trendingVideos().map(v => ({
      ...v,
      source: 'youtube' as const,
      time: 'رائج',
      channelAvatar: v.channelAvatar || subs.find(s => s.channelId === v.authorId)?.avatarUrl
    }));

    let combined: ContentItem[] = [];
    const tab = this.activeTab();
    
    if (tab === 'home') combined = [...platformVids, ...feedVids];
    else if (tab === 'explore') combined = trendingVids;
    else combined = [...platformVids, ...feedVids, ...trendingVids];

    const category = this.activeCategory();
    if (category === 'تريند') combined = trendingVids;
    else if (category !== 'الكل') {
      combined = combined.filter(v => 
        v.title.toLowerCase().includes(category.toLowerCase()) || 
        v.category === category
      );
    }

    // Sort chronologically
    return combined.sort((a, b) => {
      const aTime = a.fetchedAt || new Date(a.time || 0).getTime();
      const bTime = b.fetchedAt || new Date(b.time || 0).getTime();
      return bTime - aTime;
    });
  });

  // Actions
  setActiveTab(tab: WeTubeTab) {
    this.activeTab.set(tab);
  }

  setActiveCategory(cat: string) {
    this.activeCategory.set(cat);
  }

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  setActiveChannel(channel: { id: string, name: string, avatar?: string } | null) {
    this.activeChannel.set(channel);
    this.activeTab.set('home');
    this.searchResults.set([]);
    this.searchQuery.set('');
  }

  // TODO: Add backend/API methods to fetch actual data
  async search(query: string) {
    this.isSearching.set(true);
    this.setSearchQuery(query);
    try {
      // Simulate API call
      // const results = await api.searchYouTube(query);
      // this.searchResults.set(results);
    } catch (e) {
      console.error(e);
    } finally {
      this.isSearching.set(false);
    }
  }
}
