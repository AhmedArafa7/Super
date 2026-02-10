'use client';

import { addNotification } from './notification-store';

export type VideoStatus = 'published' | 'pending_review' | 'rejected' | 'needs_action';
export type Visibility = 'public' | 'unlisted' | 'private';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  author: string;
  authorId: string;
  time: string;
  status: VideoStatus;
  visibility: Visibility;
  allowedUserIds: string[]; // usernames for simplicity
  adminFeedback?: string;
  uploaderRole: 'admin' | 'user';
  createdAt: string;
}

const STORAGE_KEY = 'nexus_stream_videos';

const INITIAL_MOCK_VIDEOS: Video[] = [
  { id: "1", title: "Concept Art: Cyberpunk City 2077", thumbnail: "https://images.unsplash.com/photo-1533577116850-9cc66cad8a9b", views: "1.2M", author: "Master Admin", authorId: "admin-id", time: "12:04", status: 'published', visibility: 'public', allowedUserIds: [], uploaderRole: 'admin', createdAt: new Date().toISOString() },
  { id: "2", title: "React Mastery: Build a Nexus UI", thumbnail: "https://images.unsplash.com/photo-1656680632373-e2aec264296b", views: "850K", author: "Master Admin", authorId: "admin-id", time: "45:12", status: 'published', visibility: 'public', allowedUserIds: [], uploaderRole: 'admin', createdAt: new Date().toISOString() },
];

export const getStoredVideos = (): Video[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : INITIAL_MOCK_VIDEOS;
};

export const saveVideos = (videos: Video[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  window.dispatchEvent(new Event('videos-update'));
};

export const addVideo = (video: Omit<Video, 'id' | 'createdAt' | 'views'>): Video => {
  const videos = getStoredVideos();
  const newVideo: Video = {
    ...video,
    id: Math.random().toString(36).substring(2, 15),
    views: "0",
    createdAt: new Date().toISOString(),
  };
  saveVideos([newVideo, ...videos]);
  
  if (video.uploaderRole === 'user') {
    // Notify admins (mocking admin notification)
    addNotification({
      type: 'content_new',
      title: 'New Content Submission',
      message: `User ${video.author} submitted a video for review: "${video.title}"`,
      priority: 'info'
    });
  }
  
  return newVideo;
};

export const updateVideoStatus = (id: string, status: VideoStatus, feedback?: string) => {
  const videos = getStoredVideos();
  const updated = videos.map(v => {
    if (v.id === id) {
      const updatedVideo = { ...v, status, adminFeedback: feedback };
      
      // Notify uploader
      addNotification({
        type: 'content_new',
        title: status === 'published' ? 'Video Approved!' : status === 'needs_action' ? 'Video Needs Action' : 'Video Rejected',
        message: status === 'published' ? `Your video "${v.title}" is now live.` : `Admin feedback: ${feedback}`,
        userId: v.authorId,
        metadata: { videoId: v.id }
      });
      
      return updatedVideo;
    }
    return v;
  });
  saveVideos(updated);
};

export const deleteVideo = (id: string) => {
  const videos = getStoredVideos();
  saveVideos(videos.filter(v => v.id !== id));
};
