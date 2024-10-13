"use client";
import { useSession } from "next-auth/react";
import React from "react";

const Login = () => {


  const { data: session, status } = useSession(); // check  https://next-auth.js.org/getting-started/client
  return <div>Login</div>;
};

export default Login;
