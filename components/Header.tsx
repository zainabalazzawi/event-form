"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";

const Header = () => {
  const { data: session } = useSession();

  console.log(session)

  return (
    <div className="bg-background border-b">
      <div className="mx-auto px-6 py-4 flex justify-end items-center">
          {session ? (
            <div className="flex items-center gap-4">
              <span>Welcome, {session.user?.email}</span>
              <Button onClick={() => signOut({ callbackUrl: '/' })}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button>
            
            Sign in
            </Button>
          )}
      </div>
    </div>
  );
};

export default Header;
