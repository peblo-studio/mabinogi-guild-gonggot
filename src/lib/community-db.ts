import { randomUUID } from "node:crypto";
import type { CommunityCategory } from "@/lib/community";
import { prisma } from "@/lib/prisma";

type SqlCountRow = { count: number | string | bigint };

export type CommunityPostListItem = {
  id: string;
  category: CommunityCategory;
  pinned: boolean;
  title: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  authorDisplayName: string;
  authorUsername: string;
  commentCount: number;
  likeCount: number;
};

export type CommunityPostDetail = CommunityPostListItem & {
  content: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  authorDisplayName: string;
  authorUsername: string;
};

export type CommunityCommentDetail = CommunityComment & {
  updatedAt: string;
};

export type CommunityPopularPost = {
  id: string;
  category: CommunityCategory;
  title: string;
  createdAt: string;
  authorDisplayName: string;
  commentCount: number;
  likeCount: number;
};

export type CommunityHomeSnapshot = {
  counts: Record<CommunityCategory, number>;
  recentPosts: Array<{
    id: string;
    category: CommunityCategory;
    title: string;
    createdAt: string;
    authorDisplayName: string;
  }>;
};

const TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_community_posts_category_created ON community_posts(category, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_community_posts_notice_pinned ON community_posts(category, pinned DESC, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_community_posts_user_created ON community_posts(user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS community_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_community_comments_post_created ON community_comments(post_id, created_at ASC)`,
  `CREATE TABLE IF NOT EXISTS community_post_likes (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE(post_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_created ON community_post_likes(post_id, created_at ASC)`,
];

let tablesReady = false;

function toNumber(value: number | string | bigint | null | undefined) {
  return Number(value ?? 0);
}

export async function ensureCommunityTables() {
  if (tablesReady) {
    return;
  }
  for (const sql of TABLES_SQL) {
    await prisma.$executeRawUnsafe(sql);
  }
  tablesReady = true;
}

export async function createCommunityPost(input: {
  category: CommunityCategory;
  pinned?: boolean;
  title: string;
  content: string;
  userId: string;
}) {
  await ensureCommunityTables();
  const now = new Date().toISOString();
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO community_posts (id, category, pinned, title, content, user_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    id,
    input.category,
    Boolean(input.pinned && input.category === "NOTICE"),
    input.title,
    input.content,
    input.userId,
    now,
    now,
  );
  return { id };
}

export async function updateCommunityPost(input: {
  id: string;
  category: CommunityCategory;
  pinned?: boolean;
  title: string;
  content: string;
}) {
  await ensureCommunityTables();
  await prisma.$executeRawUnsafe(
    `UPDATE community_posts
      SET category = $1, pinned = $2, title = $3, content = $4, updated_at = $5
      WHERE id = $6`,
    input.category,
    Boolean(input.pinned && input.category === "NOTICE"),
    input.title,
    input.content,
    new Date().toISOString(),
    input.id,
  );
}

export async function deleteCommunityPost(postId: string) {
  await ensureCommunityTables();
  await prisma.$executeRawUnsafe(`DELETE FROM community_comments WHERE post_id = $1`, postId);
  await prisma.$executeRawUnsafe(`DELETE FROM community_post_likes WHERE post_id = $1`, postId);
  await prisma.$executeRawUnsafe(`DELETE FROM community_posts WHERE id = $1`, postId);
}

export async function listCommunityPosts(input: {
  category: CommunityCategory;
  keyword: string;
  page: number;
  pageSize: number;
}): Promise<CommunityPostListItem[]> {
  await ensureCommunityTables();
  const hasKeyword = input.keyword.length > 0;
  const keywordLike = `%${input.keyword}%`;
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT
      p.id,
      p.category,
      p.pinned AS "pinned",
      p.title,
      p.created_at AS "createdAt",
      p.updated_at AS "updatedAt",
      p.user_id AS "userId",
      u."displayName" AS "authorDisplayName",
      u.username AS "authorUsername",
      (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS "commentCount",
      (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) AS "likeCount"
     FROM community_posts p
     INNER JOIN "User" u ON u.id = p.user_id
     WHERE p.category = $1
       AND ($2::boolean = false OR p.title ILIKE $3 OR p.content ILIKE $3)
     ORDER BY CASE WHEN p.category = 'NOTICE' THEN p.pinned ELSE FALSE END DESC, p.created_at DESC
     LIMIT $4 OFFSET $5`,
    input.category,
    hasKeyword,
    keywordLike,
    input.pageSize,
    (input.page - 1) * input.pageSize,
  )) as Array<
    Omit<CommunityPostListItem, "commentCount" | "likeCount"> & {
      commentCount: number | string | bigint;
      likeCount: number | string | bigint;
    }
  >;

  return rows.map((row) => ({
    ...row,
    pinned: Boolean(row.pinned),
    commentCount: toNumber(row.commentCount),
    likeCount: toNumber(row.likeCount),
  }));
}

export async function countCommunityPosts(input: {
  category: CommunityCategory;
  keyword: string;
}): Promise<number> {
  await ensureCommunityTables();
  const hasKeyword = input.keyword.length > 0;
  const keywordLike = `%${input.keyword}%`;
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS count
     FROM community_posts p
     WHERE p.category = $1
       AND ($2::boolean = false OR p.title ILIKE $3 OR p.content ILIKE $3)`,
    input.category,
    hasKeyword,
    keywordLike,
  )) as SqlCountRow[];
  return toNumber(rows[0]?.count);
}

export async function getCommunityPostById(postId: string): Promise<CommunityPostDetail | null> {
  await ensureCommunityTables();
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT
      p.id,
      p.category,
      p.pinned AS "pinned",
      p.title,
      p.content,
      p.created_at AS "createdAt",
      p.updated_at AS "updatedAt",
      p.user_id AS "userId",
      u."displayName" AS "authorDisplayName",
      u.username AS "authorUsername",
      (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS "commentCount",
      (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) AS "likeCount"
     FROM community_posts p
     INNER JOIN "User" u ON u.id = p.user_id
     WHERE p.id = $1
     LIMIT 1`,
    postId,
  )) as Array<
    Omit<CommunityPostDetail, "commentCount" | "likeCount"> & {
      commentCount: number | string | bigint;
      likeCount: number | string | bigint;
    }
  >;

  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    ...row,
    pinned: Boolean(row.pinned),
    commentCount: toNumber(row.commentCount),
    likeCount: toNumber(row.likeCount),
  };
}

export async function isPostLikedByUser(postId: string, userId: string): Promise<boolean> {
  await ensureCommunityTables();
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS count FROM community_post_likes WHERE post_id = $1 AND user_id = $2`,
    postId,
    userId,
  )) as SqlCountRow[];
  return toNumber(rows[0]?.count) > 0;
}

export async function toggleCommunityPostLike(postId: string, userId: string) {
  await ensureCommunityTables();
  const liked = await isPostLikedByUser(postId, userId);
  if (liked) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2`,
      postId,
      userId,
    );
    return;
  }
  await prisma.$executeRawUnsafe(
    `INSERT INTO community_post_likes (id, post_id, user_id, created_at) VALUES ($1, $2, $3, $4)`,
    randomUUID(),
    postId,
    userId,
    new Date().toISOString(),
  );
}

export async function listCommunityComments(postId: string): Promise<CommunityComment[]> {
  await ensureCommunityTables();
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT
      c.id,
      c.post_id AS "postId",
      c.user_id AS "userId",
      c.content,
      c.created_at AS "createdAt",
      u."displayName" AS "authorDisplayName",
      u.username AS "authorUsername"
     FROM community_comments c
     INNER JOIN "User" u ON u.id = c.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC`,
    postId,
  )) as CommunityComment[];
  return rows;
}

export async function createCommunityComment(input: { postId: string; userId: string; content: string }) {
  await ensureCommunityTables();
  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    `INSERT INTO community_comments (id, post_id, user_id, content, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    randomUUID(),
    input.postId,
    input.userId,
    input.content,
    now,
    now,
  );
}

export async function getCommunityCommentById(
  commentId: string,
): Promise<{ id: string; postId: string; userId: string } | null> {
  await ensureCommunityTables();
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT id, post_id AS "postId", user_id AS "userId" FROM community_comments WHERE id = $1 LIMIT 1`,
    commentId,
  )) as { id: string; postId: string; userId: string }[];
  return rows[0] ?? null;
}

export async function getCommunityCommentDetailById(
  commentId: string,
): Promise<CommunityCommentDetail | null> {
  await ensureCommunityTables();
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT
      c.id,
      c.post_id AS "postId",
      c.user_id AS "userId",
      c.content,
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt",
      u."displayName" AS "authorDisplayName",
      u.username AS "authorUsername"
     FROM community_comments c
     INNER JOIN "User" u ON u.id = c.user_id
     WHERE c.id = $1
     LIMIT 1`,
    commentId,
  )) as CommunityCommentDetail[];
  return rows[0] ?? null;
}

export async function updateCommunityComment(input: { commentId: string; content: string }) {
  await ensureCommunityTables();
  await prisma.$executeRawUnsafe(
    `UPDATE community_comments SET content = $1, updated_at = $2 WHERE id = $3`,
    input.content,
    new Date().toISOString(),
    input.commentId,
  );
}

export async function deleteCommunityComment(commentId: string) {
  await ensureCommunityTables();
  await prisma.$executeRawUnsafe(`DELETE FROM community_comments WHERE id = $1`, commentId);
}

export async function getCommunityHomeSnapshot(): Promise<CommunityHomeSnapshot> {
  await ensureCommunityTables();
  const countRows = (await prisma.$queryRawUnsafe(
    `SELECT category, COUNT(*) AS count
     FROM community_posts
     GROUP BY category`,
  )) as { category: CommunityCategory; count: number | string | bigint }[];

  const counts: Record<CommunityCategory, number> = {
    NOTICE: 0,
    GUIDE: 0,
    GENERAL: 0,
  };
  for (const row of countRows) {
    if (row.category in counts) {
      counts[row.category] = toNumber(row.count);
    }
  }

  const recentPosts = (await prisma.$queryRawUnsafe(
    `SELECT
      p.id,
      p.category,
      p.title,
      p.created_at AS "createdAt",
      u."displayName" AS "authorDisplayName"
     FROM community_posts p
     INNER JOIN "User" u ON u.id = p.user_id
     ORDER BY p.created_at DESC
     LIMIT 5`,
  )) as CommunityHomeSnapshot["recentPosts"];

  return { counts, recentPosts };
}

export async function listPopularCommunityPosts(limit = 5): Promise<CommunityPopularPost[]> {
  await ensureCommunityTables();
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT
      p.id,
      p.category,
      p.title,
      p.created_at AS "createdAt",
      u."displayName" AS "authorDisplayName",
      (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS "commentCount",
      (SELECT COUNT(*) FROM community_post_likes l WHERE l.post_id = p.id) AS "likeCount"
     FROM community_posts p
     INNER JOIN "User" u ON u.id = p.user_id
     ORDER BY "likeCount" DESC, "commentCount" DESC, p.created_at DESC
     LIMIT $1`,
    limit,
  )) as Array<
    Omit<CommunityPopularPost, "commentCount" | "likeCount"> & {
      commentCount: number | string | bigint;
      likeCount: number | string | bigint;
    }
  >;

  return rows.map((row) => ({
    ...row,
    commentCount: toNumber(row.commentCount),
    likeCount: toNumber(row.likeCount),
  }));
}
