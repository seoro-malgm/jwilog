// src/utils/fetchRssPosts.ts
import Parser from "rss-parser";
import { rssFeeds } from "../data/AllFeeds";

const parser = new Parser();

// 날짜 포맷팅을 위한 유틸리티 함수
function formatRelativeDate(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 14) return "저번주";
  if (diffDays < 21) return "2주 전";
  if (diffDays < 28) return "3주 전";
  if (diffDays < 60) return "한달 전";
  return date.toLocaleDateString("ko-KR");
}

// 썸네일 추출을 위한 유틸리티 함수
function extractThumbnail(item) {
  // content:encoded 또는 description에서 이미지 URL 추출
  const content =
    item["content:encoded"] || item.content || item.description || "";
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];

  // enclosure에서 이미지 찾기
  if (item.enclosure && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }

  // media:content에서 이미지 찾기
  if (item["media:content"] && item["media:content"].url) {
    return item["media:content"].url;
  }

  return null;
}

export async function fetchAllRssPosts() {
  const allPosts = [];

  for (const feed of rssFeeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const posts = parsed.items.map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: new Date(item.pubDate || item.isoDate || ""),
        source: feed.name,
        thumbnail: extractThumbnail(item),
        relativeDate: formatRelativeDate(
          new Date(item.pubDate || item.isoDate || "")
        ),
      }));
      allPosts.push(...posts);
    } catch (e) {
      console.error(`Error fetching ${feed.name}:`, e);
    }
  }

  // 날짜순 정렬 (최신순)
  allPosts
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 10);

  return allPosts;
}
