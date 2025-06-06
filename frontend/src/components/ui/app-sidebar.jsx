import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const languages = [
  { name: "Python", url: "/lang/python" },
  { name: "JavaScript", url: "/lang/javascript" },
  { name: "Java", url: "/lang/java" },
  { name: "C++", url: "/lang/cpp" },
  { name: "C#", url: "/lang/go" },
  { name: "Go", url: "/lang/go" },
  { name: "Rust", url: "/lang/cpp" },
  { name: "C", url: "/lang/c" },
  { name: "Swift", url: "/lang/go" },
  { name: "Kotlin", url: "/lang/go" },
  { name: "Ruby", url: "/lang/go" },
  { name: "R", url: "/lang/go" },
  { name: "PHP", url: "/lang/c" },
  { name: "Dart", url: "/lang/c" },
  { name: "Scala", url: "/lang/c" },
  { name: "Lua", url: "/lang/c" },
  { name: "Shell", url: "/lang/c" },
  { name: "Perl", url: "/lang/c" },
];

export function AppSidebar({ selectedLanguage, onSelectLanguage }) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Languages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {languages.map((lang) => (
                <SidebarMenuItem key={lang.name}>
                  <SidebarMenuButton
                    onClick={() => onSelectLanguage(lang.name.toLowerCase())}
                    className={`text-left w-full ${
                      selectedLanguage === lang.name.toLowerCase()
                        ? "bg-muted text-foreground font-medium"
                        : ""
                    }`}
                  >
                    {lang.name}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
