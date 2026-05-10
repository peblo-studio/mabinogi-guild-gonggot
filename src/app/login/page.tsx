import Link from "next/link";
import { cookies } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSessionUser } from "@/lib/auth";
import { loginAction, registerAction } from "@/app/actions/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
    e?: string;
    s?: string;
  }>;
};

const ERROR_MESSAGE_MAP: Record<string, string> = {
  missing_credentials: "아이디와 비밀번호를 입력해 주세요.",
  account_not_found: "계정을 찾을 수 없어요.",
  invalid_password: "비밀번호가 올바르지 않아요.",
  login_failed: "로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  invalid_username: "아이디는 영문 소문자/숫자/_ 3~20자로 입력해 주세요.",
  invalid_display_name: "표시 이름은 2~20자로 입력해 주세요.",
  invalid_password_length: "비밀번호는 최소 6자 이상이어야 합니다.",
  duplicate_username: "이미 사용 중인 아이디입니다.",
  register_failed: "회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

const SUCCESS_MESSAGE_MAP: Record<string, string> = {
  registered: "회원가입이 완료되었습니다. 로그인해 주세요.",
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
  const notice = (await cookies()).get("login_notice")?.value;
  const [noticeType, noticeCode] = (notice ?? "").split(":");

  const noticeError =
    noticeType === "error" && noticeCode ? (ERROR_MESSAGE_MAP[noticeCode] ?? "오류가 발생했습니다.") : undefined;
  const noticeSuccess =
    noticeType === "success" && noticeCode
      ? (SUCCESS_MESSAGE_MAP[noticeCode] ?? "요청이 완료되었습니다.")
      : undefined;

  const error = noticeError ?? (params?.e ? (ERROR_MESSAGE_MAP[params.e] ?? "오류가 발생했습니다.") : params?.error);
  const success =
    noticeSuccess ??
    (params?.s
    ? (SUCCESS_MESSAGE_MAP[params.s] ?? "요청이 완료되었습니다.")
    : params?.success);

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
          {success ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
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
