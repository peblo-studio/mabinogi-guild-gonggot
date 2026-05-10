import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import { loginAction, registerAction } from "@/app/actions/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();
  if (user) {
    return (
      <>
        <Header />
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-16 sm:px-6">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center">
            <p className="text-sm text-zinc-600">{user.displayName}님은 이미 로그인되어 있어요.</p>
            <Link
              href="/reservations"
              className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              예약 페이지로 이동
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const params = await searchParams;
  const error = params?.error;

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            길드 계정 로그인
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            레이드/어비스 주간 예약을 위해 로그인이 필요합니다.
          </p>

          {error ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-base font-semibold text-zinc-900">로그인</h2>
              <form action={loginAction} className="mt-4 space-y-3">
                <input
                  type="text"
                  name="username"
                  placeholder="아이디"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                >
                  로그인
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-base font-semibold text-zinc-900">회원가입</h2>
              <form action={registerAction} className="mt-4 space-y-3">
                <input
                  type="text"
                  name="username"
                  placeholder="아이디 (영문 소문자/숫자/_)"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <input
                  type="text"
                  name="displayName"
                  placeholder="표시 이름"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호 (6자 이상)"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <input
                  type="password"
                  name="inviteCode"
                  placeholder="가입 코드 (설정한 경우에만)"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                >
                  회원가입
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
