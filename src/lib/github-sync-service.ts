'use client';

/**
 * [STABILITY_ANCHOR: GITHUB_SYNC_V1.0]
 * خدمة المزامنة مع GitHub - تتعامل مع الـ API مباشرة باستخدام fetch.
 * توفر إمكانيات القراءة والكتابة للمهندس العصبي.
 */

const GITHUB_API_URL = 'https://api.github.com';

export const getUserRepos = async (token: string) => {
  const res = await fetch(`${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) throw new Error('تعذر جلب المستودعات من GitHub.');
  return res.json();
};

export const getRepoContents = async (token: string, owner: string, repo: string, path: string = '') => {
  const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) throw new Error('تعذر جلب محتويات المستودع.');
  return res.json();
};

export const updateGitHubFile = async (
  token: string, 
  owner: string, 
  repo: string, 
  path: string, 
  content: string, 
  message: string, 
  sha?: string
) => {
  const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encoding for GitHub
      sha, // Required if updating an existing file
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'فشل تحديث الملف على GitHub.');
  }

  return res.json();
};

export const getRepoTree = async (token: string, owner: string, repo: string, branch: string = 'main') => {
  const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) throw new Error('تعذر جلب شجرة المستودع.');
  return res.json();
};
