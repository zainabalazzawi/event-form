"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useSession } from "next-auth/react";
import { LoadingState } from "@/components/LoadingState";
import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";

const GET_USER_GROUPS = gql`
  query GetUserGroups($userId: Int!) {
    userGroups(userId: $userId) {
      id
      name
      image
    }
  }
`;

const MyGroupsPage = () => {
  const client = useApolloClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const getuserGroups = async () => {
    const { data } = await client.query({
      query: GET_USER_GROUPS,
      variables: { userId },
    });
    return data.userGroups;
  };

  const { data: groups, isLoading } = useQuery({
    queryKey: ["userGroups", userId],
    queryFn: getuserGroups,
  });

  if (isLoading) {
    return (
      <LoadingState
        text="Loading groups"
        iconSize={64}
        className="animate-spin text-[#649C9E]"
      />
    );
  }
  console.log(groups);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium mb-6">Your Groups</h1>
      <div className="flex flex-row  gap-x-3">
        {groups && groups.length > 0 ? (
          groups.map((group: any) => (
            <div key={group.id} className="flex flex-col">
              <div className="mb-1 w-56 h-28">
                {group.image && (
                  <Image
                    src={group.image}
                    alt={group.name}
                    width={300}
                    height={150}
                    className="object-cover rounded-lg w-full h-full"
                  />
                )}
              </div>
              <Link
                href={`/groups/${group.id}`}
                className="font-medium text-xl hover:text-[#649C9E] hover:underline"
              >
                {group.name}
              </Link>
            </div>
          ))
        ) : (
          <div>You haven't joined any groups yet</div>
        )}
      </div>
    </div>
  );
};

export default MyGroupsPage;
