import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { site } from "@/lib/site";

export async function Header() {
  // 세션 조회가 지연되거나 실패해도 헤더 렌더링은 진행한다.
  const user = await Promise.race([
    getSessionUser().catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
  ]);

  return (
    <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
          {site.title}
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/reservations" className="text-xs text-zinc-600 hover:text-zinc-900">
            예약 게시판
          </Link>
          <Link href="/community" className="text-xs text-zinc-600 hover:text-zinc-900">
            커뮤니티
          </Link>
          {user ? (
            <>
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700">
                {user.displayName} · Lv.1
              </span>
              <form action={logoutAction}>
                <button type="submit" className="text-xs text-zinc-600 hover:text-zinc-900">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-xs text-zinc-600 hover:text-zinc-900">
              로그인
            </Link>
          )}
          <span className="text-xs text-zinc-500">{site.game}</span>
        </div>
      </div>
    </header>
  );
}
