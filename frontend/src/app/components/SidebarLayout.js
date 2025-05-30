import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SidebarLayout({ children }) {
  const rightSwipeCount = 0;
  const leftSwipeCount = 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Swipe Right Count</CardTitle>
            </CardHeader>
            <CardContent>{rightSwipeCount}</CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Swipe Left Count</CardTitle>
            </CardHeader>
            <CardContent>{leftSwipeCount}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Status</CardTitle>
            </CardHeader>
            <CardContent>{/* model status will go here lol */}</CardContent>
          </Card>

          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
