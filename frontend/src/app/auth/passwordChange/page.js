"use client";
import {useState, React} from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
 

export default function passwordChangePage() {

    const router = useRouter();
    const params = useSearchParams();
    const token = params.get("token");

    const [formData, setFormData] = useState(
        {
            "newPassword": '',
            "confirmedPassword": '',
        }
    )

    const [response, setResponse] = useState('');
    
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
          ...prev,
          [name]: value  
        }));
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:8080/auth/passwordChange?token=${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            setResponse(data.message || "");
            if(data.redirect) {
                router.push("/")
            }
        }
        catch(error) {
            console.error(error);
        }    
    }

    return (
        <div>
        <form onSubmit={handleSubmit}>
            <div>
                <Input 
                id="newPassword"
                name = "newPassword"
                value = {formData.newPassword}
                type ="password"
                placeholder="New Password"
                onChange = {handleChange} 
                required
                />

                <Input 
                id="confirmedPassword"
                name = "confirmedPassword" 
                value = {formData.confirmedPassword}
                type="password" 
                placeholder="Confirm Password" 
                onChange = {handleChange}
                required
                />
                <Button type="submit" className="w-full">
                    Change Password.
                </Button>
            </div>
        </form>

        {response && <p>{response}</p>}
        </div>
    )
}