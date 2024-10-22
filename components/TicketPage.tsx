"use client";

// import { useFormStore } from "@/app/FormFieldsStore";
import { Button } from "./ui/button";
import Link from "next/link";

const TicketPage = () => {
  // const { formFields } = useFormStore();

  
  // if (!formFields) {
  //   return null
  // }


  return (
    <div>
      {/* {formFields && (
        <>
          <h2 className="text-xl font-semibold">here is your ticket</h2>
          <div className="mt-10 p-5 border border-gray-300 rounded w-[50%]">
            <h2 className="text-xl font-semibold mb-4">
              ticket of attendee event
            </h2>
            <p className="font-semibold">
              first Name:
              <span className="font-light">{formFields.firstName}</span>
            </p>
            <p className="font-semibold">
              last Name:
              <span className="font-light">{formFields.lastName}</span>
            </p>
            <p className="font-semibold">
              email: <span className="font-light">{formFields.email}</span>
            </p>
            <p className="font-semibold">
              phone: <span className="font-light">{formFields.phone}</span>
            </p>
          </div>
        </>
      )} */}

      <Link href="/attendees-list" passHref>
        <Button className="mt-6">see the attendees</Button>
      </Link>
    </div>
  );
};

export default TicketPage;
