import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User, Session, UserRole, Complaint } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/layout/stats-card";
import { UserTable } from "@/components/admin/user-table";
import { ComplaintTable } from "@/components/admin/complaint-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: activeSessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions/active"],
  });

  const { data: complaints } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
  });

  const { data: staffUsers } = useQuery<User[]>({
    queryKey: ["/api/users/staff"],
  });

  // Only allow staff to access this page
  if (user?.role === UserRole.USER) {
    return <Redirect to="/" />;
  }

  const premiumUsers = users?.filter((u) => u.isPremium) ?? [];
  const verifiedUsers = users?.filter((u) => u.isVerified) ?? [];
  const pendingComplaints = complaints?.filter((c) => c.status === "PENDING") ?? [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total Users"
            value={users?.length ?? 0}
            description="Registered users"
          />
          <StatsCard
            title="Premium Users"
            value={premiumUsers.length}
            description="Users with premium status"
            variant="premium"
          />
          <StatsCard
            title="Verified Users"
            value={verifiedUsers.length}
            description="Users with verification"
          />
          <StatsCard
            title="Active Sessions"
            value={activeSessions?.length ?? 0}
            description="Currently active sessions"
          />
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            {isStaff(user!) && (
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
            )}
            {isOwner(user!) && (
              <TabsTrigger value="staff">Staff Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="users">
            <div>
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              <UserTable users={users ?? []} currentUser={user!} />
            </div>
          </TabsContent>

          {isStaff(user!) && (
            <TabsContent value="complaints">
              <div>
                <h2 className="text-2xl font-bold mb-4">Complaint Management</h2>
                <ComplaintTable 
                  complaints={complaints ?? []} 
                  users={users ?? []}
                  currentUser={user!}
                />
              </div>
            </TabsContent>
          )}

          {isOwner(user!) && (
            <TabsContent value="staff">
              <div>
                <h2 className="text-2xl font-bold mb-4">Staff Management</h2>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Staff Members</h3>
                  <UserTable 
                    users={staffUsers ?? []} 
                    currentUser={user!}
                    staffOnly
                  />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

function isOwner(user: User) {
  return user.role === UserRole.OWNER;
}

function isStaff(user: User) {
  return [UserRole.OWNER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPPORT].includes(
    user.role
  );
}