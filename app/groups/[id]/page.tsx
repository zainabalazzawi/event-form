"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams } from "next/navigation";
import { User, Users } from "lucide-react";
import Image from "next/image";

const GET_GROUP_BY_ID = gql`
  query GetGroupById($id: Int!) {
    group(id: $id) {
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

const getGroupById = async (client: any, id: number) => {
  const { data } = await client.query({
    query: GET_GROUP_BY_ID,
    variables: { id },
  });
  return data.group;
};

export default function GroupPage() {
  const params = useParams();
  const client = useApolloClient();
  const groupId = parseInt(params.id as string);

  const {
    data: group,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupById(client, groupId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading group</div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div className="bg-slate-50 h-full pb-[10rem]">
      <div className="flex flex-row gap-10 w-full bg-white px-[4rem]  shadow-md py-10">
        <div className="w-[55%]">
          {group.image && (
            <Image
              src={group.image}
              alt={group.name}
              width={800}
              height={400}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-4">{group.name}</h1>
          <div className="flex flex-row gap-1">
            <Users size={20} className="text-gray-400" />
            <span className="font-normal text-gray-600">
              {group.memberCount} members
            </span>
          </div>
          <div className="flex flex-row  gap-1">
            <User size={20} className="text-gray-400" /> Organized by
            <span className="font-bold"> {group.organizerEmail}</span>
          </div>
        </div>
      </div>

      <div className="mt-[3rem] mx-[5rem]">
        <p>{group.about}</p>
      </div>
    </div>
  );
}
