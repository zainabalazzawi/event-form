"use client";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchStore } from "@/store/searchStore";
import { formatTimeRange } from "@/lib/utils";
import EditEventForm from "./EditEventForm";
import { Calendar, CircleCheck, Pencil, Plus, Trash } from "lucide-react";
import Image from "next/image";
import JoinEventButton from "./JoinEventButton";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import CreateGroupEventForm from "./CreateGroupEventForm";
 export type Event = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizer: string;
  attendeeCount: number;
  email: string;
  image: string;
};

const DELETE_EVENT = gql`
  mutation DeleteEvent($id: Int!) {
    deleteEvent(id: $id)
  }
`;
const GET_GROUP_EVENTS = gql`
  query GetGroupEvents($groupId: Int!) {
    groupEvents(groupId: $groupId) {
      id
      title
      description
      startDate
      endDate
      organizer
      attendeeCount
      email
      image
    }
  }
`;

const CHECK_GROUP_ADMIN = gql`
  query CheckGroupAdmin($groupId: Int!) {
    groupMembers(groupId: $groupId) {
      members {
        id
        role
        userId
        groupId
        joinedAt
      }
      pageSize
    }
  }
`;

const getGroupEvents = async (client: any, groupId: number) => {
  const { data } = await client.query({
    query: GET_GROUP_EVENTS,
    variables: { groupId },
  });
  return data.groupEvents;
};

interface GroupEventListProps {
  groupId: number;
}

const GroupEventList = ({ groupId }: GroupEventListProps) => {
  const client = useApolloClient();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const { searchQuery } = useSearchStore();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["groupEvents", groupId],
    queryFn: () => getGroupEvents(client, groupId),
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
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const { data } = await client.mutate({
        mutation: DELETE_EVENT,
        variables: { id: eventId },
      });
      return data.deleteEvent;
    },
    onSuccess: (_, deletedEventId) => {
      queryClient.setQueryData(
        ["groupEvents", groupId],
        (oldEvents: Event[] = []) =>
          oldEvents.filter((event) => event.id !== deletedEventId)
      );
      setEventToDelete(null);
    },
  });

  const handleDelete = (eventId: number) => {
    setEventToDelete(eventId);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete);
    }
  };

  const filteredEvents = events?.filter(
    (event: Event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div>Loading events...</div>;
  if (isError) return <div>Error loading events</div>;


  console.log(memberData?.members?.some(
    (member: any) =>
      member.role === "admin" &&
      member.userId === parseInt(session?.user?.id as string)
  ))
  return (
    <div className="px-8 mt-8 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Upcoming events</h1>
        {memberData?.members?.some(
          (member: any) =>
            member.role === "admin" &&
            member.userId === parseInt(session?.user?.id as string)
        ) && (
          <Button
            onClick={() => setShowEventDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create Event
          </Button>
        )}
      </div>
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-[800px]">
          <CreateGroupEventForm
            groupId={groupId}
            onSuccess={() => setShowEventDialog(false)}
          />
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-4 gap-4">
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event: Event) => (
            <div
              key={event.id}
              className="mb-4 border border-gray-300 rounded-lg"
            >
              <div className="mb-4 w-full h-48 bg-neutral-200 rounded-t-lg">
                {event.image && (
                  <Image
                    src={event.image}
                    alt={event.title}
                    width={300}
                    height={150}
                    className="object-cover h-48 w-full rounded-t-lg"
                  />
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-row gap-2 items-center font-semibold hover:text-[#649C9E] hover:underline">
                  <Link href={`/groups/${groupId}/events/${event.id}`}>
                    <span className="font-bold text-xl">{event.title}</span>
                  </Link>
                  {userId &&
                    session?.user?.email?.toLowerCase() ===
                      event.email?.toLowerCase() && (
                      <div className="flex gap-2">
                        <Pencil
                          size={15}
                          onClick={() => setEditingEvent(event)}
                          className="cursor-pointer hover:text-blue-600"
                        />
                        <Trash
                          size={15}
                          onClick={() => handleDelete(event.id)}
                          className="cursor-pointer text-red-600 hover:text-red-600"
                        />
                      </div>
                    )}
                </div>
                <div className="text-base text-slate-600 font-semibold">
                  Hosted by:&nbsp;{event.organizer}
                </div>
                <div className="flex flex-col gap-1">
                  <Calendar size={15} className="text-gray-600" />
                  <span className="font-medium">
                    {formatTimeRange(event.startDate, event.endDate).date}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatTimeRange(event.startDate, event.endDate).time}
                  </span>
                </div>
                <div className="flex felx-row items-center gap-3">
                  <CircleCheck size={15} className="text-gray-600" />
                  <span className="font-light">
                    {event.attendeeCount} going
                  </span>
                </div>
                <div className="mt-4">
                  <JoinEventButton eventId={event.id} groupId={groupId} />

                </div>
              </div>
            </div>
          ))
        ) : (
          <div>No events found</div>
        )}
      </div>

      {editingEvent && (
        <EditEventForm
          event={editingEvent}
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
      <Dialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && setEventToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventToDelete(null)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupEventList;
