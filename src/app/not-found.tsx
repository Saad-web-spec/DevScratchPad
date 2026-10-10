import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="flex items-center gap-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white border-r border-zinc-700 pr-4">
          404
        </h1>
        <p className="text-sm sm:text-base font-mono text-zinc-400">
          This page could not be found.
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 text-xs font-mono text-zinc-500 hover:text-white transition-colors underline underline-offset-4"
      >
        ← Return Home
      </Link>
    </div>
  );
}
