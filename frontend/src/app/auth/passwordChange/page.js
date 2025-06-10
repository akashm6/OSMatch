'use client';

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DoubleRingSpinner from "@/app/components/DoubleRingSpinner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z
  .object({
    newPassword: z.string().min(6, {
      message: "Password must be at least 6 characters long.",
    }),
    confirmedPassword: z.string().min(6, {
      message: "Confirm Password is required.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmedPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

export default function PasswordChangePage() {
  return (
    <Suspense fallback={<div className="text-center mt-12">Loading...</div>}>
      <PasswordChangeForm />
    </Suspense>
  );
}

function PasswordChangeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmedPassword: "",
    },
  });

  const renderLabel = (label) =>
    label === "confirmedPassword" ? "Confirm Password" : "Password";

  const onSubmit = async (data, e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SPRINGBOOT_API}/auth/passwordChange?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const text = await res.json();
        form.setError("root", { message: text.message });
        return;
      }

      const responseData = await res.json();
      setResponse(responseData.message || "");

      if (responseData.redirect) {
        router.push("/");
      }
    } catch (error) {
      form.setError("root", {
        message: "Something went wrong. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6">Create New Password</h1>

      {loading ? (
        <DoubleRingSpinner />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {["newPassword", "confirmedPassword"].map((fieldName) => (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{renderLabel(fieldName)}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {form.formState.errors.root && (
              <p className="text-md text-red-500">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button type="submit" className="w-full">
              Register
            </Button>
          </form>
        </Form>
      )}

      {response && <p>{response}</p>}
    </div>
  );
}