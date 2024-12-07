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
  const showCreateGroupButton = pathname !== "/create-group";

  const handleCreateEventClick = () => {
    router.push("/create-event");
  };

  const handleCreateGroupClick = () => {
    router.push("/create-group");
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
          {session ? (
            <div className="flex items-center gap-4">
              <span>Welcome {session.user?.name}</span>
              <Button onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </div>
          ) : (
            <SignInDialog>
              <Button variant="outline" className="mr-4">
                Sign in
              </Button>
            </SignInDialog>
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
          {showCreateGroupButton && (
            <>
              {session && (
                <Button onClick={handleCreateGroupClick} className="mx-4">
                  Create Group
                </Button>
              )}
              {!session && (
                <SignInDialog redirectUrl="/create-group">
                  <Button className="mx-4">Create Group</Button>
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
