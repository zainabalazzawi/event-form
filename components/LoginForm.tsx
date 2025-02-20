import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";

export type LoginFormData = {
  email: string;
  password: string;
};

const LoginForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { register, handleSubmit } = form;

  const loginMutation = async (loginData: LoginFormData) => {
    const result = await signIn("credentials", {
      redirect: false,
      email: loginData.email,
      password: loginData.password,
    });

    if (result?.error) {
      console.log(result.error);
      throw new Error(result.error);
    }

    return result;
  };
  
  const mutation = useMutation({
    mutationFn: loginMutation,
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      }
    }
  });

  const handleGoogleSignIn = () => {
    signIn("google", { 
      redirect: false,
      callbackUrl: window.location.origin 
    }).then((result) => {
      if (result?.ok && !result?.error && onSuccess) {
        onSuccess();
      }
    });
  };

  const onHandleSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };

  
  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full"
      >
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
          <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <FormItem className="my-5">
            <FormLabel>Email</FormLabel>
            <Input {...register("email")} />
          </FormItem>

          <FormItem className="my-5">
            <FormLabel>Password</FormLabel>
            <Input type="password" {...register("password")} />
          </FormItem>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          {mutation.isError && (
            <div className="mt-4 p-4 text-red-800 border border-red-800 rounded text-center">
              Invalid email or password
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
