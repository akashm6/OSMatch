'use client'
import {React, useState} from "react";
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import DoubleRingSpinner from "@/app/components/DoubleRingSpinner";

export default function PasswordChangeInputPage() {

   const [loading, setLoading] = useState(false);
    const emailSchema = z.object({
      "email": z.string().email({message: "Invalid email address. Try again."})
    })

    const form = useForm({
      resolver: zodResolver(emailSchema),
      defaultValues: {
        email: ""
      }
    })

    const [confirmationMessage, setConfirmationMessage] = useState('');

    const onSubmit = async (data) => {
      setLoading(true);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SPRINGBOOT_API}/auth/sendEmail`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data.email,
          });

          if(!res.ok) {
            const text = await res.json() ;
            form.setError("root", {message: text.message});
            return;
          }
          const responseData = await res.json();
          setConfirmationMessage(responseData.message || '');
        }
        catch(error) {
          form.setError("root", { message: "Something went wrong. Please try again." })
          console.error(error)
        }  
        finally {
          setLoading(false);
        }
    }

    return (
      <div className="max-w-md mx-auto mt-12">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
    
        {loading ? (
          <DoubleRingSpinner />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                key="email"
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="m@mail.com"
                      />
                    </FormControl>
                    <FormDescription>
                      An email will be sent to this email to reset your password.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
    
              {form.formState.errors.root && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.root.message}
                </p>
              )}
    
              <Button type="submit" className="w-full">
                Send Email
              </Button>
            </form>
          </Form>
        )}
    
        {confirmationMessage && <p className="mt-4 text-green-600">{confirmationMessage}</p>}
      </div>
    );
  }    