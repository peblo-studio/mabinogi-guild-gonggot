import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import type { CommunityCategory } from "@/lib/community";
import { COMMUNITY_CATEGORY_OPTIONS, getCategoryLabel } from "@/lib/community";
import { countCommunityPosts, listCommunityPosts, listPopularCommunityPosts } from "@/lib/community-db";

export const dynamic = "force-dynamic";

type CommunityPageProps = {
  searchParams?: Promise<{
    category?: string;
    message?: string;
    keyword?: string;
    page?: string;
  }>;
};

function normalizeCategory(raw: string | undefined): CommunityCategory {
  if (raw === "NOTICE" || raw === "GUIDE" || raw === "GENERAL") {
    return raw;
  }
  return "NOTICE";
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const category = normalizeCategory(params?.category);
  const keyword = (params?.keyword ?? "").trim();
  const page = Math.max(1, Number(params?.page ?? "1") || 1);
  const pageSize = 10;
  const sessionUser = await getSessionUser();

  const [posts, totalCount, popularPosts]: [
    Awaited<ReturnType<typeof listCommunityPosts>>,
    number,
    Awaited<ReturnType<typeof listPopularCommunityPosts>>,
  ] = await Promise.all([
    Promise.race([
      listCommunityPosts({
        category,
        keyword,
        page,
        pageSize,
      }),
      new Promise<Awaited<ReturnType<typeof listCommunityPosts>>>((resolve) =>
        setTimeout(() => resolve([]), 1200),
      ),
    ]),
    Promise.race([
      countCommunityPosts({ category, keyword }),
      new Promise<number>((resolve) => setTimeout(() => resolve(0), 1200)),
    ]),
    Promise.race([
      listPopularCommunityPosts(5),
      new Promise<Awaited<ReturnType<typeof listPopularCommunityPosts>>>((resolve) =>
        setTimeout(() => resolve([]), 1200),
      ),
    ]),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              커뮤니티 게시판
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              공지사항, 공략, 자유게시판을 이용할 수 있습니다.
            </p>
          </div>
          {sessionUser ? (
            <Link
              href={`/community/new?category=${category}`}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              글쓰기
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              로그인 후 글쓰기
            </Link>
          )}
        </div>

        {params?.message ? (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {params.message}
          </p>
        ) : null}

        <form action="/community" className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="category" value={category} />
          <input
            type="text"
            name="keyword"
            defaultValue={keyword}
            placeholder="제목/내용 검색"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white">
            검색
          </button>
          {keyword ? (
            <Link href={`/community?category=${category}`} className="text-xs text-zinc-600 hover:underline">
              검색 초기화
            </Link>
          ) : null}
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          {COMMUNITY_CATEGORY_OPTIONS.map((item) => {
            const active = item.value === category;
            return (
              <Link
                key={item.value}
                href={`/community?category=${item.value}`}
                className={`rounded-full px-3 py-1 text-xs ${
                  active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {posts.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              {getCategoryLabel(category)} 게시글이 아직 없습니다.
            </li>
          ) : (
            posts.map((post) => (
              <li key={post.id} className="px-4 py-3">
                <Link href={`/community/${post.id}`} className="block">
                  <p className="text-sm font-medium text-zinc-900">
                    {post.pinned ? "📌 " : ""}
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    작성자 {post.authorDisplayName} · 작성 {new Date(post.createdAt).toLocaleString("ko-KR")} · 수정{" "}
                    {new Date(post.updatedAt).toLocaleString("ko-KR")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    좋아요 {post.likeCount} · 댓글 {post.commentCount}
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
          <span>
            총 {totalCount}개 · {page}/{totalPages} 페이지
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/community?category=${category}&keyword=${encodeURIComponent(keyword)}&page=${page - 1}`}
                className="rounded border border-zinc-300 px-2 py-1"
              >
                이전
              </Link>
            ) : (
              <span className="rounded border border-zinc-200 px-2 py-1 text-zinc-400">이전</span>
            )}
            {page < totalPages ? (
              <Link
                href={`/community?category=${category}&keyword=${encodeURIComponent(keyword)}&page=${page + 1}`}
                className="rounded border border-zinc-300 px-2 py-1"
              >
                다음
              </Link>
            ) : (
              <span className="rounded border border-zinc-200 px-2 py-1 text-zinc-400">다음</span>
            )}
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">인기글 TOP 5</h2>
          {popularPosts.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">아직 인기글 집계 데이터가 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {popularPosts.map((post) => (
                <li key={post.id} className="rounded-lg border border-zinc-200 px-3 py-2">
                  <Link href={`/community/${post.id}`} className="block">
                    <p className="text-xs text-zinc-500">{getCategoryLabel(post.category)}</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{post.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      좋아요 {post.likeCount} · 댓글 {post.commentCount} · {post.authorDisplayName}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
