"use client";
import {useState, React} from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import DoubleRingSpinner from "@/app/components/DoubleRingSpinner";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
  } from "@/components/ui/form"
 
  const formSchema = z.object({
    "newPassword": z.string().min(6, {message: "Password must be at least 6 characters long."}),
    "confirmedPassword": z.string().min(6, {message: "Confirm Password is required."})
})
.refine((data) => data.newPassword === data.confirmedPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
});

export default function passwordChangePage() {

    const router = useRouter();
    const [loading, setLoading] = useState(false)
    const params = useSearchParams();
    const token = params.get("token");
    const [response, setResponse] = useState('');

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newPassword: "",
            confirmedPassword: ""
        }
    });

    const renderLabel = (label) => {

        return (label === "confirmedPassword") ? "Confirm Password" : "Password"
    }

    const onSubmit = async (data, e) => {
        e.preventDefault();
        setLoading(true)
        console.log("sending to backend... ", data)
        try {
            const res = await fetch(`http://localhost:8080/auth/passwordChange?token=${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if(!res.ok) {
                const text = await res.json();
                form.setError("root", {message: text.message});
                return;
            }

            const responseData = await res.json();
            setResponse(responseData.message || "");
            if(responseData.redirect) {
                router.push("/")
            }
        }
        catch(error) {
            form.error("root", {message: "Something went wrong. Try again."});
        }    
        finally {
          setLoading(false);
        }
    }

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
                    <Input
                      {...field}
                      type="password"
                      placeholder=""
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {form.formState.errors.root && (
            <p className="text-md text-red-500">{form.formState.errors.root.message}</p>
          )}

          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
      </Form>
    )}
        {response && <p>{response}</p>}
        </div>
    )
}