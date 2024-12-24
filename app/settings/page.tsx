"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { data: session } = useSession();


  const sizeClassName = `w-80 h-80 rounded-full `
  console.log(session?.user?.image);
  return (
    <div className="flex justify-center min-h-screen bg-gray-50 py-12">
      <div className="w-full mx-[10rem] bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-8">Profile</h1>

        <div className="flex flex-col items-center">
          {session?.user?.image ? (
            <div className={`${sizeClassName}`}>
              <Image
                src={session?.user?.image}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className={`${sizeClassName}bg-gray-200 flex items-center justify-center`}>
              <span className="text-4xl text-gray-500">
                {session?.user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1">
              Name
            </label>
            <p className="text-lg">{session?.user?.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <p className="text-lg">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
