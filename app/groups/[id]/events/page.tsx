"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams } from "next/navigation";
import GroupHeader from "@/components/GroupHeader";
import GroupEventList from "@/components/GroupEventList";
import { LoadingState } from "@/components/LoadingState";


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

const EventsPage = () => {
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


    if (isLoading) {
      return (
        <LoadingState
          text='Loading group event'
          iconSize={64}
          className="animate-spin text-[#649C9E]"
        />
      ) }

  return (
    <div className="bg-slate-50 h-full pb-[10rem]">
      <GroupHeader group={group} />
      <div className="m-6">
        <GroupEventList groupId={groupId} />
      </div>
    </div>
  );
};

export default EventsPage;
