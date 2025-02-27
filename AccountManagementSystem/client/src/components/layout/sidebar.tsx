import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { UserRole } from "@shared/schema";
import { useLocale } from "@/hooks/use-locale";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import {
  Users,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
  UserPlus,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const { t } = useLocale();

  const isStaff = user?.role !== UserRole.USER;
  const isOwner = user?.role === UserRole.OWNER;

  return (
    <div className="w-64 border-r bg-sidebar p-4 flex flex-col">
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <span className="font-bold text-lg">{t('common.appName')}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>

      <nav className="flex-1 py-4">
        <div className="space-y-1">
          <Button
            variant={location === "/" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setLocation("/")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t('navigation.dashboard')}
          </Button>

          {isStaff && (
            <Button
              variant={location === "/admin" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setLocation("/admin")}
            >
              <Users className="mr-2 h-4 w-4" />
              {t('navigation.admin')}
            </Button>
          )}

          {isOwner && (
            <Button
              variant={location === "/create-account" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setLocation("/create-account")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t('navigation.createAccount')}
            </Button>
          )}

          <Button
            variant={location === "/complaints" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setLocation("/complaints")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {t('navigation.complaints')}
          </Button>
        </div>
      </nav>

      <div className="border-t pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start mb-4"
          onClick={() => setLocation("/profile")}
        >
          <div className="flex items-center gap-3 px-2">
            <User className="h-5 w-5" />
            <div>
              <p className="font-medium flex items-center gap-1 text-left">
                {user?.displayName || user?.username}
                {user?.isVerified && (
                  <CheckCircle className="h-4 w-4 text-primary fill-primary" />
                )}
              </p>
              <p className="text-xs text-muted-foreground text-left">
                {t(`roles.${user?.role.toLowerCase()}`)}
              </p>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('auth.logout')}
        </Button>
      </div>
    </div>
  );
}