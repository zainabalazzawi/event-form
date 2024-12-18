"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams } from "next/navigation";
import GroupHeader from "@/components/GroupHeader";
import { DataTable } from "@/components/ui/data-table";
import { memberColumns } from "./memberColumns.const";

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

const GET_GROUP_MEMBERS_LIST = gql`
  query GetGroupMembersList($groupId: Int!) {
    groupMembers(groupId: $groupId) {
      members {
        id
        userId
        groupId
        name
        role
        image
        joinedAt
      }
      pageSize
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

const MembersPage = () => {
  const params = useParams();
  const client = useApolloClient();
  const groupId = parseInt(params.id as string);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupById(client, groupId),
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: async () => {
      const { data } = await client.query({
        query: GET_GROUP_MEMBERS_LIST,
        variables: { groupId },
      });
      return data.groupMembers;
    },
  });

  if (groupLoading || membersLoading) return <div>Loading...</div>;

  return (
    <div className="bg-slate-50 h-full pb-[10rem]">
      <GroupHeader group={group} />
      <div className="container mx-auto py-10">
        <DataTable
          columns={memberColumns}
          data={membersData?.members}
          pageSize={membersData?.pageSize}
        />
      </div>
    </div>
  );
};

export default MembersPage;
