import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Files, FolderOpen, LayoutGrid, Trash2, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const { url } = usePage();

    // Several items share the /files path, so work out which one is current here.
    const [path, query = ''] = url.split('?');
    const allScope = new URLSearchParams(query).get('scope') === 'all';
    const inTrash = path.startsWith('/files/trash');
    const inFiles = path === '/files' || path.startsWith('/files/');

    const mainNavItems: NavItem[] = [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid, isActive: path === '/dashboard' },
        { title: 'My files', url: '/files', icon: FolderOpen, isActive: inFiles && !inTrash && !allScope },
        { title: 'Trash', url: '/files/trash', icon: Trash2, isActive: inTrash && !allScope },
    ];

    const adminNavItems: NavItem[] = [
        { title: 'All files', url: '/files?scope=all', icon: Files, isActive: inFiles && allScope },
        { title: 'Users', url: '/admin/users', icon: Users, isActive: path.startsWith('/admin/users') },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {auth.user.is_admin && <NavMain title="Admin" items={adminNavItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
