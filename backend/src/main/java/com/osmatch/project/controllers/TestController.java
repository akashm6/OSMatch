package com.osmatch.project.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("hello")
public class TestController {

    @GetMapping("user")
    public String sayHelloUser() {
        return "hello user!";
    }

    @GetMapping("admin")
    public String sayHelloAdmin() {
        return "hello admin!";
    }

}
