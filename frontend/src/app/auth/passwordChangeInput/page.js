'use client'
import {React, useState} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function passwordChangeInputPage() {

    const [formData, setFormData] = useState({
        "email": ''
    });

    const [confirmationMessage, setConfirmationMessage] = useState('');

    const handleSubmit = async () => {
        try {
          const res = await fetch(`http://localhost:8080/auth/sendEmail`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: formData.email,
          });
  
          const data = await res.json();
          setConfirmationMessage(data.message || '');
        }
        catch(error) {
          console.error(error);
        }  
    }

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
          ...prev,
          [name]: value  
        }));
        console.log(formData);
    }

    return (
        <div>
            <Input
            id = "email"
            name ="email"
            type = "email"
            placeholder = "m@email.com"
            value = {formData.email}
            onChange = {handleChange}
            required
            >
            </Input>
            <Button variant="outline" className="w-full" onClick = {handleSubmit}>
                Send Password Reset Email
            </Button>
            {confirmationMessage && <p>{confirmationMessage}</p>}
        </div>
    )





}