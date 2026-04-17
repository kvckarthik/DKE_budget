import { getMyChapter } from "@/lib/actions/chapters";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { membership, chapter } = await getMyChapter();

  return (
    <div className="flex min-h-screen">
      <Sidebar role={membership.role} chapterName={chapter.name} />
      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
