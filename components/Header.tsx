"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { usePathname, useRouter } from "next/navigation";
import SignInDialog from "./SignInDialog";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const showCreateEventButton = pathname !== "/create-event";
  const handleCreateEventClick = () => {
    router.push("/create-event");
  };

  console.log(session);

  return (
    <div className="bg-background border-b">
      <div className="mx-auto px-6 py-4 flex justify-end items-center">
        {session && (
          <div className="flex items-center gap-4">
            <span>Welcome, {session.user?.email}</span>
            <Button onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </Button>
          </div>
        )}
        {showCreateEventButton && (
          <>
            {session && (
              <Button onClick={handleCreateEventClick} className="mx-4">
                Create Event
              </Button>
            )}
            {!session && (
              <SignInDialog redirectUrl="/create-event">
                <Button className="mx-4">Create Event</Button>
              </SignInDialog>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
