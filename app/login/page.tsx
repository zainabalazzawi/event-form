"use client";

import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

type LoginFormData = {
  email: string;
  password: string;
};

const loginMutation = async (loginData: LoginFormData) => {
  const result = await signIn("credentials", {
    redirect: false,
    email: loginData.email,
    password: loginData.password,
  });

  if (result?.error) {
    console.log(result.error)
    throw new Error(result.error);
  }

  return result;
};

const Login = () => {
const router = useRouter();

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { register, handleSubmit } = form;

  const mutation = useMutation({
    mutationFn: loginMutation,
    onSuccess: () => {
      console.log("Successfully logged in!");
       router.push("/");
    },
    onError: (error: Error) => {
      console.log("Login failed", error.message);
    },
  });

  const onHandleSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="p-10 w-[50%]">
        <h1 className="font-semibold">Login</h1>
        <Form {...form}>
          <form onSubmit={handleSubmit(onHandleSubmit)}>
            <FormItem className="my-5">
              <FormLabel>Email</FormLabel>
              <Input type="email" {...register("email")} required />
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>Password</FormLabel>
              <Input type="password" {...register("password")} required />
            </FormItem>

            <Button type="submit" className="mt-6" disabled={mutation.isPending}>
              {mutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>

        {mutation.isError && (
          <div className="mt-4 p-4 text-red-800 border border-red-800 rounded text-center">
          invalid email or passwod
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
