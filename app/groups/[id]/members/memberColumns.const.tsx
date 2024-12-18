import { ColumnDef } from "@tanstack/react-table"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Member = {
  id: number
  name: string
  role: string
  image?: string
}

export const memberColumns: ColumnDef<Member>[] = [
  // {
  //   id: "avatar",
  //   header: "",
  //   cell: ({ row }) => {
  //     const member = row.original
  //     return (
  //       <Avatar>
  //         <AvatarImage src={member.image} />
  //         <AvatarFallback>
  //           {member.name.split(" ").map((n) => n[0]).join("")}
  //         </AvatarFallback>
  //       </Avatar>
  //     )
  //   },
  //   size: 70,
  // },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original?.name}
        </div>
      );
    },
    size: 70,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.role}</div>
    ),
    size: 70,
  }
] 