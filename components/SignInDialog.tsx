import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

type SignInDialogProps = {
  children: ReactNode;
  redirectUrl?: string;
  signInDescription?: string;
  signUpDescription?: string;
};

const SignInDialog = ({ 
  children, 
  redirectUrl,
  signInDescription,
  signUpDescription
}: SignInDialogProps) => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [open, setOpen] = useState(false);
  
  const handleLoginSuccess = () => {
    setOpen(false);
    if (redirectUrl) {
      router.push(redirectUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create Account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isSignUp ? signUpDescription : signInDescription}
          </DialogDescription>
        </DialogHeader>

        {!isSignUp ? (
          <>
            <LoginForm onSuccess={handleLoginSuccess} />
            <Button variant="outline" onClick={() => setIsSignUp(true)}>
              Create an account
            </Button>
          </>
        ) : (
          <>
            <SignupForm onSuccess={() => setIsSignUp(false)} />
            <Button variant="outline" onClick={() => setIsSignUp(false)}>
              Back to sign in
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;
