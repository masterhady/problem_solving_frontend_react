import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCheck, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";


const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegister = searchParams.get("register") === "true";

  const [authMode, setAuthMode] = useState<"login" | "register">(isRegister ? "register" : "login");
  const [userType, setUserType] = useState<"jobseeker" | "company">("company");
  const [showPassword, setShowPassword] = useState(false);

  const [user, setUser] = useState({ username: "", password: "" });
  const [userRegister, setUserRegister] = useState({ email: "", password: "", username: "", first_name: "", last_name: "" });

  //check if user already exists and redirect
  useLayoutEffect(() => {
    const currentuser = JSON.parse(localStorage.getItem("currentuser"));
    if (currentuser) {
      navigate(currentuser.role === "jobseeker" ? "/seeker/dashboard" : "/company/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };
  const handleChangeRegister = (e) => {
    setUserRegister({ ...userRegister, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.username || !user.password) {
      toast.error("Please enter both username and password.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "https://web-production-495dc.up.railway.app/api"}/auth/login/`, {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        // Assuming the backend sends error details in the 'detail' field
        throw new Error(data.detail || "Login failed!");
      }

      localStorage.setItem("token", JSON.stringify(data.access));
      localStorage.setItem("currentuser", JSON.stringify(data.user));
      toast.success("Login successful!");
      if (data.user.role === "company") {
        navigate("/company/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    }
  };

  const validateRegistration = () => {
    const { username, password, first_name, last_name } = userRegister;
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    const usernameRegex = /^(?![0-9])(?!.*[\u0600-\u06FF]).*$/; // No arabic, not starting with number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (userType === "jobseeker") {
      if (!nameRegex.test(first_name) || !nameRegex.test(last_name)) {
        toast.error("Names should only contain letters.");
        return false;
      }
    }

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return false;
    }

    if (!usernameRegex.test(username)) {
      toast.error("Username cannot start with a number or contain Arabic characters.");
      return false;
    }

    if (!passwordRegex.test(password)) {
      toast.error("Password must be at least 8 characters, with uppercase, lowercase, and a number.");
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegistration()) {
      return;
    }

    const registrationData = {
      ...userRegister,
      role: userType,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "https://web-production-495dc.up.railway.app/api"}/auth/register/`, {
        method: "POST",
        body: JSON.stringify(registrationData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Account creation failed!";
        if (data.username) errorMessage = `Username: ${data.username[0]}`;
        else if (data.email) errorMessage = `Email: ${data.email[0]}`;
        else if (data.detail) errorMessage = data.detail;
        throw new Error(errorMessage);
      }

      localStorage.setItem("token", JSON.stringify(data.access));
      localStorage.setItem("currentuser", JSON.stringify(data.user));
      toast.success("Account created successfully!");
      if (data.user.role === "company") {
        navigate("/company/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Coding Theme Background */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0 pointer-events-none" />

      <Card className="w-full max-w-md p-8 shadow-2xl relative z-10 border-t-4 border-primary animate-scale-in">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/5">
            <FileCheck className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Problem Solver</h1>
            <p className="text-sm text-muted-foreground mt-1">Master your coding interview skills</p>
          </div>
        </div>

        <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as "login" | "register")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="your.username"
                  required
                  className="transition-smooth"
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="transition-smooth pr-10"
                    onChange={handleChange}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link to="#" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full gradient-primary transition-smooth hover:opacity-90">
                Sign In
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <div className="space-y-4">
              <Tabs value={userType} onValueChange={(v) => setUserType(v as "jobseeker" | "company")}>
                <TabsList className="grid w-full grid-cols-1 mb-4">
                  <TabsTrigger value="company">Company</TabsTrigger>
                </TabsList>

                {/* Company Registration */}
                <TabsContent value="company">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-username">Username</Label>
                      <Input
                        id="company-username"
                        name="username"
                        type="text"
                        placeholder="your.username"
                        required
                        className="transition-smooth"
                        onChange={handleChangeRegister}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-email">Email</Label>
                      <Input
                        id="company-email"
                        name="email"
                        type="email"
                        placeholder="hr@company.com"
                        required
                        className="transition-smooth"
                        onChange={handleChangeRegister}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="company-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          className="transition-smooth pr-10"
                          onChange={handleChangeRegister}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full gradient-primary transition-smooth hover:opacity-90">
                      Create Company Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          {authMode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => setAuthMode("register")}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => setAuthMode("login")}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <div className="mt-6">
          <Link to="/">
            <Button variant="ghost" className="w-full transition-smooth">
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
