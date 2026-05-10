import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200/80 bg-white/80 py-8">
      <div className="mx-auto max-w-3xl px-4 text-center text-xs text-zinc-500 sm:px-6">
        <p>비공식 팬 페이지 · {site.game}</p>
        <p className="mt-1">© {new Date().getFullYear()} {site.title}</p>
      </div>
    </footer>
  );
}
