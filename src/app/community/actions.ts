"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import type { CommunityCategory } from "@/lib/community";
import { canWriteCategory, isCommunityCategory } from "@/lib/community";
import {
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  getCommunityCommentById,
  getCommunityPostById,
  toggleCommunityPostLike,
  updateCommunityComment,
  updateCommunityPost,
} from "@/lib/community-db";

function normalizeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function buildListPath({
  category,
  keyword,
  page,
  message,
}: {
  category: CommunityCategory;
  keyword?: string;
  page?: number;
  message?: string;
}) {
  const search = new URLSearchParams({ category });
  if (keyword) {
    search.set("keyword", keyword);
  }
  if (page && page > 1) {
    search.set("page", String(page));
  }
  if (message) {
    search.set("message", message);
  }
  return `/community?${search.toString()}`;
}

function parseCategory(raw: string): CommunityCategory | null {
  if (!isCommunityCategory(raw)) {
    return null;
  }
  return raw;
}

function redirectToLogin(message: string): never {
  const search = new URLSearchParams({ error: message });
  redirect(`/login?${search.toString()}`);
}

export async function createPostAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirectToLogin("로그인 후 글 작성이 가능합니다.");
  }

  const categoryRaw = normalizeText(formData.get("category"));
  const category = parseCategory(categoryRaw);
  const pinnedRequested = formData.get("pinned") === "on";
  const title = normalizeText(formData.get("title"));
  const content = normalizeText(formData.get("content"));

  if (!category) {
    redirect("/community?message=게시판 종류가 올바르지 않습니다.");
  }
  if (!canWriteCategory(sessionUser.username, category)) {
    redirect("/community?message=공지사항 작성 권한이 없습니다.");
  }
  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");
  const pinned = isAdmin && category === "NOTICE" && pinnedRequested;
  if (title.length < 2 || title.length > 80) {
    redirect(buildListPath({ category, message: "제목은 2~80자로 입력해 주세요." }));
  }
  if (content.length < 2) {
    redirect(buildListPath({ category, message: "내용은 최소 2자 이상 입력해 주세요." }));
  }

  const post = await createCommunityPost({
    category,
    pinned,
    title,
    content,
    userId: sessionUser.id,
  });

  revalidatePath("/community");
  redirect(`/community/${post.id}?message=게시글이 등록되었습니다.`);
}

export async function updatePostAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirectToLogin("로그인 후 수정이 가능합니다.");
  }

  const postId = normalizeText(formData.get("postId"));
  const categoryRaw = normalizeText(formData.get("category"));
  const category = parseCategory(categoryRaw);
  const pinnedRequested = formData.get("pinned") === "on";
  const title = normalizeText(formData.get("title"));
  const content = normalizeText(formData.get("content"));

  if (!postId || !category) {
    redirect("/community?message=요청이 올바르지 않습니다.");
  }

  const post = await getCommunityPostById(postId);

  if (!post) {
    redirect("/community?message=게시글을 찾을 수 없습니다.");
  }

  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");
  const isOwner = post.userId === sessionUser.id;
  if (!isOwner && !isAdmin) {
    redirect(`/community/${post.id}?message=수정 권한이 없습니다.`);
  }
  if (!canWriteCategory(sessionUser.username, category)) {
    redirect(`/community/${post.id}?message=공지사항으로 변경할 권한이 없습니다.`);
  }
  if (title.length < 2 || title.length > 80) {
    redirect(`/community/${post.id}/edit?message=제목은 2~80자로 입력해 주세요.`);
  }
  if (content.length < 2) {
    redirect(`/community/${post.id}/edit?message=내용은 최소 2자 이상 입력해 주세요.`);
  }
  const pinned = isAdmin && category === "NOTICE" && pinnedRequested;

  await updateCommunityPost({
    id: post.id,
    category,
    pinned,
    title,
    content,
  });

  revalidatePath("/community");
  revalidatePath(`/community/${post.id}`);
  redirect(`/community/${post.id}?message=게시글이 수정되었습니다.`);
}

export async function deletePostAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirectToLogin("로그인 후 삭제가 가능합니다.");
  }

  const postId = normalizeText(formData.get("postId"));
  if (!postId) {
    redirect("/community?message=삭제할 게시글이 없습니다.");
  }

  const post = await getCommunityPostById(postId);
  if (!post) {
    redirect("/community?message=이미 삭제된 게시글입니다.");
  }

  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");
  const isOwner = post.userId === sessionUser.id;
  if (!isOwner && !isAdmin) {
    redirect(`/community/${post.id}?message=삭제 권한이 없습니다.`);
  }

  await deleteCommunityPost(post.id);

  revalidatePath("/community");
  redirect(buildListPath({ category: post.category, message: "게시글이 삭제되었습니다." }));
}

export async function togglePostLikeAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirectToLogin("로그인 후 좋아요를 누를 수 있습니다.");
  }

  const postId = normalizeText(formData.get("postId"));
  if (!postId) {
    redirect("/community?message=잘못된 요청입니다.");
  }

  await toggleCommunityPostLike(postId, sessionUser.id);

  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
  redirect(`/community/${postId}`);
}

export async function createCommentAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirectToLogin("로그인 후 댓글 작성이 가능합니다.");
  }

  const postId = normalizeText(formData.get("postId"));
  const content = normalizeText(formData.get("content"));

  if (!postId) {
    redirect("/community?message=잘못된 요청입니다.");
  }
  if (content.length < 1 || content.length > 500) {
    redirect(`/community/${postId}?message=댓글은 1~500자로 입력해 주세요.`);
  }

  await createCommunityComment({ postId, userId: sessionUser.id, content });

  revalidatePath(`/community/${postId}`);
  redirect(`/community/${postId}?message=댓글이 등록되었습니다.`);
}

export async function deleteCommentAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirectToLogin("로그인 후 댓글 삭제가 가능합니다.");
  }

  const commentId = normalizeText(formData.get("commentId"));
  const postId = normalizeText(formData.get("postId"));
  if (!commentId || !postId) {
    redirect("/community?message=잘못된 요청입니다.");
  }

  const comment = await getCommunityCommentById(commentId);
  if (!comment) {
    redirect(`/community/${postId}?message=이미 삭제된 댓글입니다.`);
  }

  const post = await getCommunityPostById(postId);
  if (!post) {
    redirect("/community?message=게시글을 찾을 수 없습니다.");
  }

  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");
  const isOwner = comment.userId === sessionUser.id;
  const isPostOwner = post.userId === sessionUser.id;

  if (!isOwner && !isPostOwner && !isAdmin) {
    redirect(`/community/${postId}?message=댓글 삭제 권한이 없습니다.`);
  }

  await deleteCommunityComment(comment.id);

  revalidatePath(`/community/${postId}`);
  redirect(`/community/${postId}?message=댓글이 삭제되었습니다.`);
}

export async function updateCommentAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirectToLogin("로그인 후 댓글 수정이 가능합니다.");
  }

  const commentId = normalizeText(formData.get("commentId"));
  const postId = normalizeText(formData.get("postId"));
  const content = normalizeText(formData.get("content"));
  if (!commentId || !postId) {
    redirect("/community?message=잘못된 요청입니다.");
  }
  if (content.length < 1 || content.length > 500) {
    redirect(`/community/${postId}/comment/${commentId}/edit?message=댓글은 1~500자로 입력해 주세요.`);
  }

  const comment = await getCommunityCommentById(commentId);
  if (!comment) {
    redirect(`/community/${postId}?message=댓글을 찾을 수 없습니다.`);
  }
  const post = await getCommunityPostById(postId);
  if (!post) {
    redirect("/community?message=게시글을 찾을 수 없습니다.");
  }

  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");
  const isOwner = comment.userId === sessionUser.id;
  const isPostOwner = post.userId === sessionUser.id;
  if (!isOwner && !isPostOwner && !isAdmin) {
    redirect(`/community/${postId}?message=댓글 수정 권한이 없습니다.`);
  }

  await updateCommunityComment({ commentId, content });

  revalidatePath(`/community/${postId}`);
  redirect(`/community/${postId}?message=댓글이 수정되었습니다.`);
}

export async function togglePostPinAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirectToLogin("로그인 후 이용해 주세요.");
  }
  const isAdmin = canWriteCategory(sessionUser.username, "NOTICE");
  if (!isAdmin) {
    redirect("/community?message=공지 고정 권한이 없습니다.");
  }

  const postId = normalizeText(formData.get("postId"));
  if (!postId) {
    redirect("/community?message=잘못된 요청입니다.");
  }

  const post = await getCommunityPostById(postId);
  if (!post) {
    redirect("/community?message=게시글을 찾을 수 없습니다.");
  }
  if (post.category !== "NOTICE") {
    redirect(`/community/${post.id}?message=공지사항 게시글만 고정할 수 있습니다.`);
  }

  await updateCommunityPost({
    id: post.id,
    category: post.category,
    pinned: !post.pinned,
    title: post.title,
    content: post.content,
  });

  revalidatePath("/community");
  revalidatePath(`/community/${post.id}`);
  redirect(`/community/${post.id}?message=${post.pinned ? "고정이 해제되었습니다." : "상단 고정되었습니다."}`);
}
