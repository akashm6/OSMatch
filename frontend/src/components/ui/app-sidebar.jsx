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
  { name: "Go", url: "/lang/go" },
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
