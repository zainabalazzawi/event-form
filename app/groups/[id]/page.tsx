"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams } from "next/navigation";
import GroupHeader from "@/components/GroupHeader";

const GET_GROUP_BY_ID = gql`
  query GetGroupById($id: Int!) {
    group(id: $id) {
      id
      name
      about
      createdAt
      organizerId
      organizerEmail
      organizerName
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
      <GroupHeader group={group} />
      <div className="mt-[3rem] mx-[5rem]">
        <p>{group.about}</p>
      </div>
    </div>
  );
}
