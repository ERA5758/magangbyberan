
import { LoginForm } from "@/components/auth/login-form";
import AppLogo from "@/components/shared/app-logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <AppLogo size={144} />
            <p className="text-sm text-muted-foreground font-semibold">Bangun Karier, Mulai Dari Magang</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
