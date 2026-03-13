import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In | SaintSal Labs",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark p-4">
      <LoginForm />
    </div>
  );
}
