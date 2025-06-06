"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { z } from "zod"
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

const registerSchema = z
  .object({
    username: z.string().min(2, { message: "Username must be at least 2 characters" }),
    first_name: z.string().min(1, { message: "First name is required" }),
    last_name: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(6, { message: "Confirm password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  })

export default function RegisterPage() {
  const router = useRouter()
  const [message, setMessage] = useState('');

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values) => {
    try {
      const res = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const text = await res.text()
        form.setError("root", { message: text })
        return
      }
      const data = await res.json();
      setMessage(data.message);
      router.push("/")
    } catch (err) {
      form.setError("root", { message: "Something went wrong. Please try again." })
    }
  }

  const renderLabel = (name) => {
    if (name === "confirmPassword") return "Confirm Password"
    return name
      .replace("_", " ")
      .replace(/^\w/, (c) => c.toUpperCase())
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-bold mb-6">Register</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {["username", "first_name", "last_name", "email", "password", "confirmPassword"].map((fieldName) => (
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
                      type={["password", "confirmPassword"].includes(fieldName) ? "password" : "text"}
                      placeholder={renderLabel(fieldName)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {form.formState.errors.root && (
            <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
          )}

          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
        
      </Form>
      {message && <p>{message}</p>}
    </div>
  )
}
