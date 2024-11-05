"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { usePathname, useRouter } from "next/navigation";
import SignInDialog from "./SignInDialog";
import { Input } from "./ui/input";
import { useSearchStore } from "@/store/searchStore";
import { useDebouncedCallback } from "use-debounce";
import { Search } from "lucide-react";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useSearchStore();

  const showCreateEventButton = pathname !== "/create-event";
  const handleCreateEventClick = () => {
    router.push("/create-event");
  };

  const handleSearch = useDebouncedCallback((term) => {
    setSearchQuery(term);
  }, 300);

  return (
    <div className="bg-background border-b">
      <div className="mx-auto px-6 py-4 flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center">
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
    </div>
  );
};

export default Header;
