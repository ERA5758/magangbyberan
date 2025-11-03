import { AddUserForm } from "@/components/admin/add-user-form";
import { LoginForm } from "@/components/auth/login-form";
import AppLogo from "@/components/shared/app-logo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <AppLogo className="h-8 w-auto text-primary" />
        </div>
        <LoginForm />
        <div className="mt-4 text-center text-sm">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="link" className="text-muted-foreground">
                        Create First Admin Account
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] md:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                    <DialogTitle>Create First Admin Account</DialogTitle>
                    <DialogDescription>
                        Use this form to create the initial administrator account.
                    </DialogDescription>
                    </DialogHeader>
                    <AddUserForm onSuccess={() => window.location.reload()} />
                </DialogContent>
            </Dialog>
        </div>
      </div>
    </div>
  );
}
