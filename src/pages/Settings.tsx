import DashboardSidebar from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

const Settings = () => {
  const location = useLocation();
  const userType = location.pathname.includes("/company") ? "company" : "seeker";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type={userType} />

      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto animate-fade-in">

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>

          <Card className="p-8 gradient-card shadow-soft mb-6">
            <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    defaultValue="John"
                    className="transition-smooth"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    defaultValue="Doe"
                    className="transition-smooth"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="john.doe@example.com"
                  className="transition-smooth"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  defaultValue="+1 (555) 123-4567"
                  className="transition-smooth"
                />
              </div>

              <Button type="submit" className="gradient-primary transition-smooth hover:opacity-90">
                Save Changes
              </Button>
            </form>
          </Card>

          <Card className="p-8 gradient-card shadow-soft">
            <h2 className="text-2xl font-semibold mb-6">Security</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="transition-smooth"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="transition-smooth"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="transition-smooth"
                />
              </div>

              <Button type="submit" className="gradient-primary transition-smooth hover:opacity-90">
                Update Password
              </Button>
            </form>
          </Card>
        </div >
      </main >
    </div >
  );
};

export default Settings;
