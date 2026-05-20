import { ChevronRight } from 'lucide-react';
import type { NavItem } from '@/components/app-sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavMain({ items }: { items: NavItem[] }) {
    return (
        <div className="flex w-full flex-col gap-1">
            {items.map((item, index) => {
                if (item.isSection) {
                    return (
                        <SidebarGroupLabel
                            key={index}
                            className="mt-4 px-2 text-xs"
                        >
                            {item.label}
                        </SidebarGroupLabel>
                    );
                }

                if (item.children) {
                    return (
                        <SidebarGroup key={index} className="p-0">
                            <SidebarMenu>
                                <Collapsible
                                    asChild
                                    defaultOpen={item.isActive}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                            >
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.children.map(
                                                    (subItem, subIndex) => (
                                                        <SidebarMenuSubItem
                                                            key={subIndex}
                                                        >
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={
                                                                    subItem.isActive
                                                                }
                                                            >
                                                                <a
                                                                    href={
                                                                        subItem.href ||
                                                                        '#'
                                                                    }
                                                                >
                                                                    <span>
                                                                        {
                                                                            subItem.title
                                                                        }
                                                                    </span>
                                                                </a>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ),
                                                )}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        </SidebarGroup>
                    );
                }

                return (
                    <SidebarGroup key={index} className="p-0">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={item.isActive}
                                    tooltip={item.title}
                                >
                                    <a href={item.href || '#'}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                );
            })}
        </div>
    );
}
