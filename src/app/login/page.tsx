import { LoginForm } from "@/components/auth/login-form";
import AppLogo from "@/components/shared/app-logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <AppLogo className="h-8 w-auto text-primary" />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
