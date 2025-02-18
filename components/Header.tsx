"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { usePathname, useRouter } from "next/navigation";
import SignInDialog from "./SignInDialog";
import { Input } from "./ui/input";
import { useSearchStore } from "@/store/searchStore";
import { useDebouncedCallback } from "use-debounce";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useSearchStore();
  const [isOpen, setIsOpen] = useState(false);

  const showCreateGroupButton = pathname !== "/create-group";

  const handleCreateGroupClick = () => {
    router.push("/create-group");
  };

  const handleSearch = useDebouncedCallback((term) => {
    setSearchQuery(term);
  }, 300);

  return (
    <div className="bg-background border-b">
      <div className="mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Image
            src="/Eventy.svg"
            alt="Logo"
            width={100}
            height={100}
            className="cursor-pointer"
            onClick={() => router.push("/")}
          />
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
        </div>

        <div className="flex items-center">
          {showCreateGroupButton && (
            <>
              {session && (
                <Button onClick={handleCreateGroupClick} className="mx-4">
                  Start New Group
                </Button>
              )}
              {!session && (
                <SignInDialog
                  signInDescription="Sign in to create group"
                  signUpDescription="Create an account to create group"
                  redirectUrl="/create-group"
                >
                  <Button className="mx-4">Start New Group</Button>
                </SignInDialog>
              )}
            </>
          )}
          {session && <div className="mr-3">Welcome {session.user?.name}</div>}
          {!session ? (
            <SignInDialog>
              <Button variant="outline" className="mr-4">
                Sign in
              </Button>
            </SignInDialog>
          ) : (
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <div className="flex flex-row items-center">
                  <Avatar>
                    <AvatarImage
                      src={session?.user?.image ?? ""}
                      className="object-cover cursor-pointer"
                    />
                    <AvatarFallback>
                      {session?.user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {isOpen ? (
                    <ChevronUp size={25} className="ml-1 text-slate-400" />
                  ) : (
                    <ChevronDown size={25} className="ml-1 text-slate-400" />
                  )}{" "}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/my-groups")}>
                  Your groups
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
