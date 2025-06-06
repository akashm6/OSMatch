import React from "react";
import Creatable from "react-select";

export default function SearchDropdown({ suggestions, onInputChange, onSelect }) {
    const handleInputChange = (newValue) => {
        onInputChange(newValue);
    };

    return (
        <Creatable
            options={suggestions}
            isSearchable
            onInputChange={handleInputChange}
            onChange={onSelect}
            placeholder="Search location"
        />
    );
}
