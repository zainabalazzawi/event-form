"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchStore } from "@/store/searchStore";
import Image from "next/image";
import { Users, Pencil } from "lucide-react";

type Group = {
  id: number;
  name: string;
  about: string;
  createdAt: string;
  organizerId: number;
  organizerEmail: string;
  memberCount: number;
  image?: string;
};

const GET_GROUPS = gql`
  query GetGroups {
    groups {
      id
      name
      about
      createdAt
      organizerId
      organizerEmail
      memberCount
      image
    }
  }
`;

const getGroups = async (client: any) => {
  const { data } = await client.query({
    query: GET_GROUPS,
  });
  return data.groups;
};

const GroupListPage = () => {
  const client = useApolloClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const { searchQuery } = useSearchStore();

  const {
    data: groups,
    isLoading,
    isError,
  } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: () => getGroups(client),
  });

  const filteredGroups = groups?.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.about.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: Unable to load groups. Please try again later.</div>;
  }

  return (
    <div className="px-8 mt-8 pb-6">
      <div className="grid grid-cols-4 gap-4">
        {filteredGroups && filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className="mb-4 border border-gray-300 rounded-lg"
            >
              <div className="mb-4 w-full h-48 bg-neutral-200 rounded-t-lg">
                {group.image && (
                  <Image
                    src={group.image}
                    alt={group.name}
                    width={300}
                    height={150}
                    className="object-cover h-48 w-full rounded-t-lg"
                  />
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-row gap-2 items-center">
                  <Link
                    href={`/groups/${group.id}`}
                    className="font-bold text-xl hover:text-[#649C9E] hover:underline"
                  >
                    {group.name}
                  </Link>
                  {userId &&
                    session?.user?.email?.toLowerCase() ===
                      group.organizerEmail?.toLowerCase() && (
                    <Pencil size={15} className="cursor-pointer" />
                  )}
                </div>
                <p className="text-gray-600 mt-2 line-clamp-2">{group.about}</p>
                <div className="flex items-center gap-2 mt-4 text-gray-600">
                  <Users size={15} />
                  <span>{group.memberCount} members</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div>No groups found</div>
        )}
      </div>
    </div>
  );
};

export default GroupListPage;
