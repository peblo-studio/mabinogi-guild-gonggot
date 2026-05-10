import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updatePostAction } from "@/app/community/actions";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import { COMMUNITY_CATEGORY_OPTIONS, canWriteCategory } from "@/lib/community";
import { getCommunityPostById } from "@/lib/community-db";

type EditPostPageProps = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ message?: string }>;
};

export default async function EditPostPage({ params, searchParams }: EditPostPageProps) {
  const { postId } = await params;
  const query = await searchParams;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    const search = new URLSearchParams({ error: "로그인 후 수정이 가능합니다." });
    redirect(`/login?${search.toString()}`);
  }

  const post = await Promise.race([
    getCommunityPostById(postId),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
  ]);
  if (!post) {
    notFound();
  }

  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");
  const isOwner = post.userId === sessionUser.id;
  if (!isOwner && !isAdmin) {
    redirect(`/community/${post.id}?message=수정 권한이 없습니다.`);
  }

  const writableCategories = COMMUNITY_CATEGORY_OPTIONS.filter((item) =>
    canWriteCategory(sessionUser.username, item.value),
  );

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">게시글 수정</h1>
        {query?.message ? (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {query.message}
          </p>
        ) : null}

        <form action={updatePostAction} className="mt-6 space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
          <input type="hidden" name="postId" value={post.id} />

          <div>
            <label htmlFor="category" className="mb-1 block text-xs text-zinc-600">
              게시판
            </label>
            <select
              id="category"
              name="category"
              defaultValue={post.category}
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
              <input type="checkbox" name="pinned" defaultChecked={post.pinned} />
              공지사항 상단 고정
            </label>
          ) : null}

          <div>
            <label htmlFor="title" className="mb-1 block text-xs text-zinc-600">
              제목
            </label>
            <input
              id="title"
              name="title"
              defaultValue={post.title}
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
              defaultValue={post.content}
              rows={12}
              minLength={2}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
              저장
            </button>
            <Link href={`/community/${post.id}`} className="text-sm text-zinc-600 hover:underline">
              취소
            </Link>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
