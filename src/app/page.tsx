import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCategoryLabel } from "@/lib/community";
import { getCommunityHomeSnapshot } from "@/lib/community-db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const hasDiscord = Boolean(site.links.discord);
  const hasCafe = Boolean(site.links.cafe);
  const snapshot = await Promise.race([
    getCommunityHomeSnapshot(),
    new Promise<Awaited<ReturnType<typeof getCommunityHomeSnapshot>>>((resolve) =>
      setTimeout(
        () =>
          resolve({
            counts: { NOTICE: 0, GUIDE: 0, GENERAL: 0 },
            recentPosts: [],
          }),
        1200,
      ),
    ),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-100/70 p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-zinc-200/60 blur-3xl" />
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Guild Community Hub</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                {site.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                {site.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/reservations"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white"
                >
                  레이드/어비스 예약
                </Link>
                <Link
                  href="/community"
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-800"
                >
                  커뮤니티 게시판
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <Image
                src="/images/guild-banner.png"
                alt="군것질연구소 길드 배너"
                width={649}
                height={213}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">공지사항</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{snapshot.counts.NOTICE}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">공략 게시글</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{snapshot.counts.GUIDE}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">자유게시글</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{snapshot.counts.GENERAL}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <h2 className="font-medium text-zinc-900">최근 커뮤니티 글</h2>
            {snapshot.recentPosts.length === 0 ? (
              <p className="mt-3 text-zinc-500">아직 작성된 글이 없습니다.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {snapshot.recentPosts.map((post) => (
                  <li key={post.id} className="rounded-lg border border-zinc-200 px-3 py-2">
                    <Link href={`/community/${post.id}`} className="block">
                      <p className="text-xs text-zinc-500">{getCategoryLabel(post.category)}</p>
                      <p className="mt-1 font-medium text-zinc-900">{post.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {post.authorDisplayName} · {new Date(post.createdAt).toLocaleString("ko-KR")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4">
            <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
              <h2 className="font-medium text-zinc-900">길드 예약 게시판</h2>
              <p className="mt-1 text-zinc-600">
                월요일부터 일요일까지 주간 레이드/어비스 예약을 등록하고 확인할 수 있습니다.
              </p>
              <Link
                href="/reservations"
                className="mt-3 inline-flex rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
              >
                예약 페이지로 이동
              </Link>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
              <h2 className="font-medium text-zinc-900">커뮤니티 게시판</h2>
              <p className="mt-1 text-zinc-600">
                공지사항, 공략, 자유게시판에서 길드원들과 정보를 공유하세요.
              </p>
              <Link
                href="/community"
                className="mt-3 inline-flex rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
              >
                커뮤니티로 이동
              </Link>
            </section>
          </div>
        </section>

        <section className="mx-auto mt-8 w-full max-w-md space-y-3">
          <h2 className="text-sm font-medium text-zinc-900">연결</h2>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white text-sm">
            <li className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-zinc-600">디스코드</span>
              {hasDiscord ? (
                <a
                  href={site.links.discord}
                  className="font-medium text-zinc-900 underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  참여하기
                </a>
              ) : (
                <span className="text-zinc-400">준비 중</span>
              )}
            </li>
            <li className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-zinc-600">카페·커뮤니티</span>
              {hasCafe ? (
                <a
                  href={site.links.cafe}
                  className="font-medium text-zinc-900 underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  바로가기
                </a>
              ) : (
                <span className="text-zinc-400">준비 중</span>
              )}
            </li>
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
