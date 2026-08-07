export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1F2430]">
      <header className="border-b border-[#E4E4E0] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#2F6F5E]">
              Maintenance Ledger
            </p>
            <h1 className="font-heading text-3xl font-semibold text-[#1F2430]">
              DormFix
            </h1>
          </div>
          <span className="rounded-full bg-[#2F6F5E]/10 px-3 py-1 font-mono text-xs text-[#2F6F5E]">
            Submit
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
