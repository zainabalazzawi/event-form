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

  const onHandleSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };

  return (
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
  );
};
export default LoginForm;
