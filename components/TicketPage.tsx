"use client";

import { useFormStore } from "@/app/FormFieldsStore";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

const TicketPage = () => {
  const router = useRouter();
  const { formFields } = useFormStore();

  if (!formFields) {
    router.push("/");
  }

  return (
    <div>
      {formFields && (
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
      )}

      <Button className="mt-6" onClick={() => router.push("/attendees-list")}>
        see the attendees
      </Button>
    </div>
  );
};

export default TicketPage;
