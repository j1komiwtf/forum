import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Session } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/layout/stats-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions/user"],
  });

  const activeSessions = sessions?.filter((s) => s.isActive) ?? [];
  const expiredSessions = sessions?.filter((s) => !s.isActive) ?? [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <StatsCard
            title="Total Sessions"
            value={sessions?.length ?? 0}
            description="All time sessions"
          />
          <StatsCard
            title="Active Sessions"
            value={activeSessions.length}
            description="Currently active sessions"
          />
          <StatsCard
            title="Account Status"
            value={user?.isPremium ? "Premium" : "Standard"}
            description={user?.isVerified ? "Verified Account" : "Regular Account"}
            variant={user?.isPremium ? "premium" : "default"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {isLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : activeSessions.length > 0 ? (
                  <div className="space-y-4">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            Started: {format(new Date(session.startTime), "PPp")}
                          </div>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center">
                    No active sessions
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {isLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : expiredSessions.length > 0 ? (
                  <div className="space-y-4">
                    {expiredSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {format(new Date(session.startTime), "PPp")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Duration:{" "}
                            {format(
                              new Date(session.endTime!).getTime() -
                                new Date(session.startTime).getTime(),
                              "HH:mm:ss"
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">Ended</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center">
                    No session history
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
