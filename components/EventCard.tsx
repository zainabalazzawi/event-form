import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, CircleCheck, Pencil, Trash2 } from "lucide-react";
import { formatTimeRange } from "@/lib/utils";
import JoinEventButton from "./JoinEventButton";
import { Event } from "./GroupEventList";
import { useRouter } from "next/navigation";

interface EventCardProps {
  event: Event;
  groupId: number;
  userId?: number | null;
  userEmail?: string | null;
  handleDelete: (eventId: number) => void;
}

const EventCard = ({ event, groupId, userId, userEmail, handleDelete }: EventCardProps) => {
  const router = useRouter();

  return (
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
          userEmail?.toLowerCase() ===
            event.email?.toLowerCase() && (
            <div className="flex gap-2">
              <Pencil
                size={18}
                onClick={() =>
                  router?.push(
                    `/groups/${groupId}/events/${event.id}/edit`
                  )
                }
                className="cursor-pointer hover:text-blue-600"
              />
              <Trash2
                size={18}
                onClick={() => handleDelete(event.id)}
                className="cursor-pointer text-red-800 hover:text-red-600"
              />
            </div>
          )}
      </div>
      <div className="text-base text-slate-600 font-semibold">
        Hosted by:&nbsp;{event.organizer}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-x-2">
          <Calendar size={15} className="text-gray-600" />
          <span className="font-medium">
            {formatTimeRange(event.startDate, event.endDate).date}
          </span>
        </div>
        <div className="flex flex-row gap-x-2">
          <Clock size={15} className="text-gray-600" />
          <span className="text-sm text-gray-600">
            {formatTimeRange(event.startDate, event.endDate).time}
          </span>
        </div>
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
  );
};

export default EventCard; 