"use client";

import React, { useState } from "react";
import {
    Calendar, BookOpen, Wallet, AlignJustify, CircleDot,
    AlignLeft, Building, ChevronRight, Megaphone, Bell,
    ChevronDown, Video, Settings, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/lib/auth/types";
import { updateUserProfile } from "@/lib/auth-store";

interface DulmsLayoutProps {
    user: User | null;
}

export function DulmsLayout({ user }: DulmsLayoutProps) {
    const [activeItem, setActiveItem] = useState('e-learning');
    const [activeSubItem, setActiveSubItem] = useState('files');
    const [showDropdown, setShowDropdown] = useState(false);

    // Return to normal theme
    const handleExitDulms = async () => {
        if (user?.id) {
            await updateUserProfile(user.id, { activeTheme: 'nexus' });
            window.location.reload();
        }
    };

    const isDark = user?.themeMode === 'dark';

    const courses = [
        { id: "AI421", name: "Data Center Virtualization" },
        { id: "AI422", name: "Embedded and Real Time Operating Systems" },
        { id: "AI423", name: "Wireless Sensor Protocols and Programming" },
        { id: "AI424", name: "Deep Learning" },
        { id: "AI425", name: "Graduation Project in AI (II)" },
    ];

    return (
        <div className={cn(
            "min-h-screen w-full flex flex-col font-sans transition-colors duration-300",
            isDark ? "bg-[#0f111a] text-slate-200" : "bg-[#ecf0f1] text-[#333]"
        )}>

            {/* Top Navbar */}
            <header className={cn(
                "h-[50px] w-full flex items-center justify-between px-4 shrink-0 transition-colors z-20 shadow-sm",
                isDark ? "bg-[#151822] border-b border-white/5" : "bg-[#34495e] text-white"
            )}>
                <div className="flex items-center gap-2">
                    <div className="flex flex-col select-none">
                        <span className="text-[#f1c40f] font-black text-xl leading-none tracking-wide">DULMS</span>
                        <span className={cn("text-[8px] uppercase tracking-widest", isDark ? "text-slate-400" : "text-slate-300")}>
                            Delta University Learning Management System
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-5 mr-2">
                    <button className="relative">
                        <Megaphone className={cn("size-4", isDark ? "text-slate-400" : "text-white/80")} />
                    </button>
                    <button className="relative">
                        <Bell className={cn("size-4", isDark ? "text-slate-400" : "text-white/80")} />
                        <span className="absolute -top-1.5 -right-1.5 size-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                            39
                        </span>
                    </button>

                    <div className="relative pl-4 border-l border-white/20">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <div className="size-8 rounded-full border border-white/30 overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="User" className="size-full object-cover" />
                                ) : (
                                    <span className="text-white text-xs">{user?.name?.charAt(0) || "U"}</span>
                                )}
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                                <span className="text-sm font-medium">{user?.username || '4221438'}</span>
                                <ChevronDown className="size-3 opacity-70" />
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className={cn(
                                "absolute top-full right-0 mt-2 w-48 rounded-md shadow-lg py-1 border z-50",
                                isDark ? "bg-[#1e2130] border-white/10" : "bg-white border-slate-200"
                            )}>
                                <button
                                    onClick={handleExitDulms}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                                        isDark ? "text-slate-200" : "text-slate-700"
                                    )}
                                >
                                    <LogOut className="size-4" />
                                    Return to Nexus
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Layout Area */}
            <div className="flex flex-1 overflow-hidden h-[calc(100vh-50px)]">

                {/* Left Sidebar */}
                <aside className={cn(
                    "w-[240px] flex flex-col shrink-0 overflow-y-auto overflow-x-hidden transition-colors border-r",
                    isDark ? "bg-[#151822] border-white/5" : "bg-[#34495e] border-transparent shadow-[2px_0_5px_rgba(0,0,0,0.1)] text-white"
                )}>
                    {/* Semester Header */}
                    <div className="p-3 bg-[#2ecc71] text-white flex items-center gap-3">
                        <Calendar className="size-6 opacity-90" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">Spring - 2025-2026</span>
                            <span className="text-[10px] opacity-90">Current Semester</span>
                        </div>
                    </div>

                    <div className="flex flex-col w-full py-2">

                        {/* Standard Menu Items */}
                        {[
                            { id: 'exams', label: 'Exams & Grades', icon: BookOpen },
                            { id: 'financial', label: 'Financial', icon: Wallet },
                            { id: 'placements', label: 'Placements', icon: AlignJustify },
                            { id: 'others', label: 'Others', icon: CircleDot },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveItem(item.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b",
                                    isDark ? "border-white/5 hover:bg-white/5" : "border-white/5 hover:bg-white/10"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="size-4 opacity-70" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                <ChevronDown className="size-3 opacity-50 -rotate-90" />
                            </button>
                        ))}

                        {/* E-Learning (Active Section) */}
                        <div className="flex flex-col w-full">
                            <button
                                onClick={() => setActiveItem('e-learning')}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b",
                                    activeItem === 'e-learning'
                                        ? (isDark ? "bg-[#c088b6] text-white" : "bg-[#c582b4] text-white")
                                        : (isDark ? "border-white/5 hover:bg-white/5" : "border-white/5 hover:bg-white/10")
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <AlignLeft className="size-4" />
                                    <span className="font-bold">E-Learning</span>
                                </div>
                                <ChevronDown className={cn("size-3", activeItem === 'e-learning' ? "rotate-0" : "-rotate-90")} />
                            </button>

                            {/* Submenu for E-Learning */}
                            {activeItem === 'e-learning' && (
                                <div className={cn(
                                    "flex flex-col w-full py-1",
                                    isDark ? "bg-[#0b0d14]" : "bg-[#2c3e50]"
                                )}>
                                    {[
                                        { id: 'quizzes', label: 'Quizzes' },
                                        { id: 'exams-sub', label: 'Exams' },
                                        { id: 'assignments', label: 'Assignments' },
                                        { id: 'discussions', label: 'Discussions' },
                                        { id: 'meetings', label: 'Meetings' },
                                        { id: 'files', label: 'Files & Materials' },
                                        { id: 'question-bank', label: 'Question Bank' },
                                    ].map(subItem => (
                                        <button
                                            key={subItem.id}
                                            onClick={() => setActiveSubItem(subItem.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-8 py-2.5 text-xs transition-colors",
                                                activeSubItem === subItem.id
                                                    ? (isDark ? "bg-[#22273b] text-white font-medium border-l-2 border-slate-400" : "bg-[#1a252f] text-white border-l-2 border-white/50")
                                                    : (isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5")
                                            )}
                                        >
                                            <ChevronRight className="size-3 opacity-60" />
                                            <span>{subItem.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bottom items */}
                        <button
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors border-b",
                                isDark ? "border-white/5 hover:bg-white/5" : "border-white/5 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Building className="size-4 opacity-70" />
                                <span className="font-medium">Hotel Reservation</span>
                            </div>
                            <ChevronDown className="size-3 opacity-50 -rotate-90" />
                        </button>
                    </div>
                </aside>

                {/* Main Content Pane */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

                    {/* Breadcrumb / Title Area */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs mb-2">
                                <div className="flex items-center gap-1 opacity-60">
                                    <span className="size-2 bg-slate-400 opacity-50 block" />
                                    <span>Home</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <h1 className={cn(
                                    "text-2xl sm:text-3xl font-light",
                                    isDark ? "text-slate-200" : "text-[#555]"
                                )}>
                                    Files / Materials List
                                </h1>
                                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-red-400 font-medium px-2 py-0.5 rounded bg-red-400/10 self-end mb-1">
                                    <Video className="size-3" />
                                    Watch Video
                                </div>
                            </div>
                            <p className={cn("text-xs mt-1", isDark ? "text-slate-400" : "text-[#777]")}>
                                List of courses that is registered in this semester, In each course there is a list of weeks that contains file and materials.
                            </p>
                        </div>
                    </div>

                    {/* Course List Blocks */}
                    <div className="flex flex-col gap-2">
                        {courses.map(course => (
                            <div
                                key={course.id}
                                className={cn(
                                    "w-full p-4 sm:p-5 rounded-sm border transition-shadow hover:shadow-sm cursor-pointer",
                                    isDark ? "bg-[#1e2130] border-white/5 hover:border-white/10" : "bg-[#f9f9f9] border-slate-200"
                                )}
                            >
                                <h3 className={cn(
                                    "text-[15px] font-bold",
                                    isDark ? "text-slate-200" : "text-[#333]"
                                )}>
                                    {course.id} - {course.name}
                                </h3>
                            </div>
                        ))}
                    </div>

                </main>
            </div>
        </div>
    );
}
