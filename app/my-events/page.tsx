"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useSession } from "next-auth/react";
import { LoadingState } from "@/components/LoadingState";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { formatTimeRange } from "@/lib/utils";

const GET_USER_EVENTS = gql`
  query GetUserEvents($userId: Int!) {
    userEvents(userId: $userId) {
      id
      title
      startDate
      endDate
      image
      groupId
    }
  }
`;

const MyEventsPage = () => {
  const client = useApolloClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const getUserEvents = async () => {
    const { data } = await client.query({
      query: GET_USER_EVENTS,
      variables: { userId },
    });
    return data.userEvents;
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ["userEvents", userId],
    queryFn: getUserEvents,
  });

  if (isLoading) {
    return (
      <LoadingState
        text="Loading events"
        iconSize={64}
        className="animate-spin text-[#649C9E]"
      />
    );
  }
  console.log(events)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium mb-6">Your Events</h1>
      <div className="flex flex-row gap-x-3">
        {events && events.length > 0 ? (
          events.map((event: any) => (
            <div key={event.id} className="flex flex-col">
              <div className="mb-1 w-56 h-28">
                {event.image && (
                  <Image
                    src={event.image}
                    alt={event.title}
                    width={300}
                    height={150}
                    className="object-cover rounded-lg w-full h-full"
                  />
                )}
              </div>
              <Link
                href={`/groups/${event.groupId}/events/${event.id}`}
                className="font-medium text-xl hover:text-[#649C9E] hover:underline"
              >
                {event.title}
              </Link>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <Clock size={16} />
                <span className="text-sm">
                  {formatTimeRange(event.startDate, event.endDate, true).date}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div>You haven't joined any events yet</div>
        )}
      </div>
    </div>
  );
};

export default MyEventsPage;
