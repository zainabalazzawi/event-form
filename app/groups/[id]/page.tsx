"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams } from "next/navigation";
import { User, Users, Plus } from "lucide-react";
import Image from "next/image";
import JoinGroupButton from "@/components/JoinGroupButton";
import CreateGroupEventForm from "@/components/CreateGroupEventForm";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EventListPage from "@/components/EventListPage";

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

const CHECK_GROUP_ADMIN = gql`
  query CheckGroupAdmin($groupId: Int!) {
    groupMembers(groupId: $groupId) {
      role
      userId
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
  const { data: session } = useSession();
  const groupId = parseInt(params.id as string);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const {
    data: group,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupById(client, groupId),
  });

  const { data: memberData } = useQuery({
    queryKey: ["groupAdmin", groupId, session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      const { data } = await client.query({
        query: CHECK_GROUP_ADMIN,
        variables: {
          groupId,
        },
      });
      return data.groupMembers;
    },
    enabled: !!session?.user?.email,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading group</div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div className="bg-slate-50 h-full pb-[10rem]">
      <div className="flex flex-col w-full bg-white shadow-md py-10">
        <div className="flex flex-row gap-10 px-[4rem]">
          <div className="w-[55%]">
            {group.image && (
              <Image
                src={group.image}
                alt={group.name}
                width={800}
                height={400}
                className="w-full h-64 object-cover rounded-lg"
                // check object-cover
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
              <span className="font-bold"> {group.organizerName}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 px-3 border-t border-gray-200">
          <JoinGroupButton groupId={group.id} />
        </div>
      </div>
      <div className="mt-[3rem] mx-[5rem]">
        <p>{group.about}</p>
      </div>

      <div className="m-6">
        <div>
          <h1>Upcoming events </h1>
          {memberData?.some((member: any) => member.role === "admin") && (
            <Button
              onClick={() => setShowEventDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create Event
            </Button>
          )}
        </div>
        <EventListPage />
      </div>
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-[800px]">
          <CreateGroupEventForm
            groupId={groupId}
            onSuccess={() => setShowEventDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
