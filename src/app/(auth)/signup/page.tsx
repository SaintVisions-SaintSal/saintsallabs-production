import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Sign Up | SaintSal Labs",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark p-4">
      <SignupForm />
    </div>
  );
}
