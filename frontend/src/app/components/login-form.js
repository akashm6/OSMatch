import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LoginForm({
  className,
  ...props
}) {

  const router = useRouter();

  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
          email: "",
          password: "",
  });


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      console.log("Submitting: ", formData);
      try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SPRINGBOOT_API}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
          });
          const data = await response.json(); 
          if (response.ok) {
              localStorage.setItem("token", data.token);
              localStorage.setItem("userId", data.userId);
              localStorage.setItem('bio', data.bio);
              setMessage(data.message || "Login Successful!")
              router.push("/home"); 
          } else {
            setMessage(data.message || "Invalid Credentials.")
          }
      } catch (error) {
          setMessage(data.message || "An error has occurred. Try again.")
          console.error("Error:", error);
      }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="https://osmatch.vercel.app/auth/passwordChangeInput"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input 
                id="password" 
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange} 
                required 
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
              <Button variant="outline" className="w-full" onClick = {() => router.push(`${process.env.NEXT_PUBLIC_SPRINGBOOT_API}/oauth2/authorization/google`)}>
                Login with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/auth/login/register" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
          {message && (
            <p className="text-sm text-center text-green-600 mt-4">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}