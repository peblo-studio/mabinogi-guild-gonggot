import Link from "next/link";
import { createPostAction } from "@/app/community/actions";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import type { CommunityCategory } from "@/lib/community";
import { COMMUNITY_CATEGORY_OPTIONS, canWriteCategory } from "@/lib/community";

type NewPostPageProps = {
  searchParams?: Promise<{
    category?: string;
    message?: string;
  }>;
};

function normalizeCategory(raw: string | undefined): CommunityCategory {
  if (raw === "NOTICE" || raw === "GUIDE" || raw === "GENERAL") {
    return raw;
  }
  return "GENERAL";
}

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const params = await searchParams;
  const category = normalizeCategory(params?.category);
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return (
      <>
        <Header />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-700">로그인 후 글 작성이 가능합니다.</p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
            >
              로그인하러 가기
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const writableCategories = COMMUNITY_CATEGORY_OPTIONS.filter((item) =>
    canWriteCategory(sessionUser.username, item.value),
  );
  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">게시글 작성</h1>
        {params?.message ? (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {params.message}
          </p>
        ) : null}

        <form action={createPostAction} className="mt-6 space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
          <div>
            <label htmlFor="category" className="mb-1 block text-xs text-zinc-600">
              게시판
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              {writableCategories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {isAdmin ? (
            <label className="flex items-center gap-2 text-xs text-zinc-600">
              <input type="checkbox" name="pinned" />
              공지사항 선택 시 상단 고정
            </label>
          ) : null}

          <div>
            <label htmlFor="title" className="mb-1 block text-xs text-zinc-600">
              제목
            </label>
            <input
              id="title"
              name="title"
              minLength={2}
              maxLength={80}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="content" className="mb-1 block text-xs text-zinc-600">
              내용
            </label>
            <textarea
              id="content"
              name="content"
              rows={12}
              minLength={2}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
              등록하기
            </button>
            <Link href={`/community?category=${category}`} className="text-sm text-zinc-600 hover:underline">
              취소
            </Link>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
