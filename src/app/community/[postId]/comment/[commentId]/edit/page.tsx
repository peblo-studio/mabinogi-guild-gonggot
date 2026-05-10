import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateCommentAction } from "@/app/community/actions";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import { canWriteCategory } from "@/lib/community";
import { getCommunityCommentDetailById, getCommunityPostById } from "@/lib/community-db";

type EditCommentPageProps = {
  params: Promise<{ postId: string; commentId: string }>;
  searchParams?: Promise<{ message?: string }>;
};

export default async function EditCommentPage({ params, searchParams }: EditCommentPageProps) {
  const { postId, commentId } = await params;
  const query = await searchParams;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    const search = new URLSearchParams({ error: "로그인 후 댓글 수정이 가능합니다." });
    redirect(`/login?${search.toString()}`);
  }

  const [post, comment] = await Promise.all([
    getCommunityPostById(postId),
    getCommunityCommentDetailById(commentId),
  ]);
  if (!post || !comment || comment.postId !== post.id) {
    notFound();
  }

  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");
  const isOwner = comment.userId === sessionUser.id;
  const isPostOwner = post.userId === sessionUser.id;
  if (!isOwner && !isPostOwner && !isAdmin) {
    redirect(`/community/${post.id}?message=댓글 수정 권한이 없습니다.`);
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">댓글 수정</h1>
        {query?.message ? (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {query.message}
          </p>
        ) : null}

        <form action={updateCommentAction} className="mt-6 space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="commentId" value={comment.id} />
          <textarea
            name="content"
            defaultValue={comment.content}
            rows={5}
            minLength={1}
            maxLength={500}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
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
