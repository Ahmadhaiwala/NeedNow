import clsx from "clsx";

export default function Home() {
  return (
    <div className={clsx('min-h-screen', 'bg-gradient-to-br', 'from-blue-50', 'to-indigo-100')}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-slate-800">Welcome to NeedNow</h1>
        <p className="mt-4 text-lg text-slate-600">Your AI Shopping Assistant</p>
      </main>
    </div>
  );
}