import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { MarketTicker } from "@/components/layout/market-ticker";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <MarketTicker />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
