import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ColumnDef } from "@tanstack/react-table";

type EventMember = {
  id: number;
  name: string;
  role: string;
  status: string;
  image?: string;
};

export const eventMemberColumns: ColumnDef<EventMember>[] = [
  {
    id: "avatar",
    header: "avatar",
    cell: ({ row }) => {
      const member = row.original;
      return (
        <Avatar>
          <AvatarImage src={member.image} className="object-cover" />
          <AvatarFallback>
            {member?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      );
    },
    size: 70,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original?.name}</div>;
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.role === "admin" ? "Organizer" : row.original.role}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original?.status}</div>;
    },
  },
];
