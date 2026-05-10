import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCommentAction,
  deleteCommentAction,
  deletePostAction,
  togglePostPinAction,
  togglePostLikeAction,
} from "@/app/community/actions";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import { canWriteCategory, getCategoryLabel } from "@/lib/community";
import {
  getCommunityPostById,
  isPostLikedByUser,
  listCommunityComments,
} from "@/lib/community-db";

export const dynamic = "force-dynamic";

type PostDetailPageProps = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ message?: string }>;
};

export default async function PostDetailPage({ params, searchParams }: PostDetailPageProps) {
  const { postId } = await params;
  const query = await searchParams;
  const sessionUser = await getSessionUser();

  const [post, comments, isLiked]: [
    Awaited<ReturnType<typeof getCommunityPostById>> | null,
    Awaited<ReturnType<typeof listCommunityComments>>,
    boolean,
  ] = await Promise.all([
    Promise.race([getCommunityPostById(postId), new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200))]),
    Promise.race([listCommunityComments(postId), new Promise<Awaited<ReturnType<typeof listCommunityComments>>>((resolve) => setTimeout(() => resolve([]), 1200))]),
    sessionUser ? Promise.race([isPostLikedByUser(postId, sessionUser.id), new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1200))]) : Promise.resolve(false),
  ]);

  if (!post) {
    notFound();
  }

  const isAdmin = sessionUser ? canWriteCategory(sessionUser.username, "NOTICE") : false;
  const isOwner = sessionUser?.id === post.userId;

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/community?category=${post.category}`} className="text-xs text-zinc-600 hover:underline">
            ← 목록으로
          </Link>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
            {getCategoryLabel(post.category)} {post.pinned ? "· 상단 고정" : ""}
          </span>
        </div>

        {query?.message ? (
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            {query.message}
          </p>
        ) : null}

        <article className="mt-4 rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{post.title}</h1>
          <p className="mt-2 text-xs text-zinc-500">
            작성자 {post.authorDisplayName}(@{post.authorUsername}) · 작성{" "}
            {new Date(post.createdAt).toLocaleString("ko-KR")} · 수정 {new Date(post.updatedAt).toLocaleString("ko-KR")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            좋아요 {post.likeCount} · 댓글 {post.commentCount}
          </p>

          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{post.content}</div>

          <div className="mt-6 flex items-center gap-2">
            {sessionUser ? (
              <form action={togglePostLikeAction}>
                <input type="hidden" name="postId" value={post.id} />
                <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700">
                  {isLiked ? "좋아요 취소" : "좋아요"}
                </button>
              </form>
            ) : (
              <Link href="/login" className="text-xs text-zinc-600 hover:underline">
                로그인 후 좋아요
              </Link>
            )}
          </div>

          <section className="mt-8 border-t border-zinc-200 pt-5">
            <h2 className="text-sm font-semibold text-zinc-900">댓글</h2>

            {sessionUser ? (
              <form action={createCommentAction} className="mt-3 space-y-2">
                <input type="hidden" name="postId" value={post.id} />
                <textarea
                  name="content"
                  rows={3}
                  minLength={1}
                  maxLength={500}
                  required
                  placeholder="댓글을 입력해 주세요."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white">
                  댓글 등록
                </button>
              </form>
            ) : (
              <p className="mt-2 text-xs text-zinc-600">댓글 작성은 로그인 후 가능합니다.</p>
            )}

            <ul className="mt-4 space-y-2">
              {comments.length === 0 ? (
                <li className="rounded-lg bg-zinc-50 px-3 py-3 text-xs text-zinc-500">첫 댓글을 남겨보세요.</li>
              ) : (
                comments.map((comment) => (
                  <li key={comment.id} className="rounded-lg border border-zinc-200 px-3 py-3">
                    <p className="text-xs text-zinc-800">{comment.content}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500">
                        {comment.authorDisplayName}(@{comment.authorUsername}) ·{" "}
                        {new Date(comment.createdAt).toLocaleString("ko-KR")}
                      </p>
                      {sessionUser &&
                      (sessionUser.id === comment.userId || sessionUser.id === post.userId || isAdmin) ? (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/community/${post.id}/comment/${comment.id}/edit`}
                            className="text-[11px] text-zinc-500 hover:underline"
                          >
                            수정
                          </Link>
                          <form action={deleteCommentAction}>
                            <input type="hidden" name="commentId" value={comment.id} />
                            <input type="hidden" name="postId" value={post.id} />
                            <button type="submit" className="text-[11px] text-zinc-500 hover:underline">
                              삭제
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {isOwner || isAdmin ? (
            <div className="mt-6 flex items-center gap-2">
              <Link
                href={`/community/${post.id}/edit`}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white"
              >
                수정
              </Link>
              {isAdmin && post.category === "NOTICE" ? (
                <form action={togglePostPinAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700"
                  >
                    {post.pinned ? "고정 해제" : "상단 고정"}
                  </button>
                </form>
              ) : null}
              <form action={deletePostAction}>
                <input type="hidden" name="postId" value={post.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700"
                >
                  삭제
                </button>
              </form>
            </div>
          ) : null}
        </article>
      </main>
      <Footer />
    </>
  );
}
