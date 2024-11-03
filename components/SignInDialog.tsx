import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useState } from "react";
import LoginForm from "@/app/components/LoginForm";
import SignupForm from "@/app/components/SignupForm";

const SignInDialog = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSignupSuccess = () => {
    setTimeout(() => {
      setIsSignUp(false);
    }, 2000);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="mt-3">Join Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create Account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Create an account to join events"
              : "Sign in to join this event"}
          </DialogDescription>
        </DialogHeader>

        {!isSignUp ? (
          <>
            <LoginForm />
            <Button variant="outline" onClick={() => setIsSignUp(true)}>
              Create an account
            </Button>
          </>
        ) : (
          <>
            <SignupForm onSuccess={handleSignupSuccess} />
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
