"use client"
import AttendeeInfo from "@/components/AttendeeInfo";
import { useParams } from "next/navigation";
import React from "react";



export type anttendeeParams =  {
  id: string
}

const page = () => {
  const params = useParams<anttendeeParams>();
  const { id } = params;
  
  return (
    <div>
      <AttendeeInfo id={parseInt(id)} />
    </div>
  );
};

export default page;
