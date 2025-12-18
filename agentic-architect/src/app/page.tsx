import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_55%)]" />
      <Dashboard />
    </main>
  );
}
