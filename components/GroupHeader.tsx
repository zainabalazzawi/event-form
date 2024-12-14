import { User, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import JoinGroupButton from "./JoinGroupButton";

type GroupHeaderProps = {
  group: {
    id: number;
    name: string;
    memberCount: number;
    organizerName: string;
    image?: string;
  };
};

const GroupHeader = ({ group }: GroupHeaderProps) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-full bg-white shadow-md pt-3">
      <div className="flex flex-row gap-10 px-[4rem]">
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
          <div className="flex flex-row gap-1">
            <User size={20} className="text-gray-400" /> Organized by
            <span className="font-bold"> {group.organizerName}</span>
          </div>
        </div>
      </div>

      <div className="mt-[10rem] px-10 py-2 border-t border-gray-200 flex justify-between items-center">
        <nav className="flex space-x-6">
          <Link
            href={`/groups/${group.id}`}
            className={`text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-50 ${
              pathname === `/groups/${group.id}`
                ? "text-gray-900 border-2 border-[#649C9E]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            About
          </Link>
          <Link
            href={`/groups/${group.id}/events`}
            className={`text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-50 ${
              pathname === `/groups/${group.id}/events`
                ? "text-gray-900 border-2 border-[#649C9E]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Events
          </Link>
          <Link
            href={`/groups/${group.id}/members`}
            className={`text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-50 ${
              pathname === `/groups/${group.id}/members`
                ? "text-gray-900 border-2 border-[#649C9E]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Members
          </Link>
        </nav>
        <JoinGroupButton groupId={group.id} />
      </div>
    </div>
  );
};

export default GroupHeader; 