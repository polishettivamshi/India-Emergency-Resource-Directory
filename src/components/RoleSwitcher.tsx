import React from "react";
import { Shield, User, Users } from "lucide-react";

interface RoleSwitcherProps {
  currentRole: "Guest" | "Registered" | "Admin";
  onChangeRole: (role: "Guest" | "Registered" | "Admin") => void;
  currentUserEmail: string;
}

export default function RoleSwitcher({ currentRole, onChangeRole, currentUserEmail }: RoleSwitcherProps) {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-100 py-2.5 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium tracking-wide font-display text-xs uppercase text-slate-400">
            AI Studio Live Role Sandbox Mode
          </span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-300 font-mono text-xs hidden md:inline">
            Active: <span className="text-sky-400 font-semibold">{currentUserEmail}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-xs px-2 hidden sm:inline">Set Role:</span>
          
          <button
            id="role-switch-guest"
            onClick={() => onChangeRole("Guest")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium text-xs cursor-pointer ${
              currentRole === "Guest"
                ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Guest
          </button>

          <button
            id="role-switch-registered"
            onClick={() => onChangeRole("Registered")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium text-xs cursor-pointer ${
              currentRole === "Registered"
                ? "bg-blue-600/20 text-blue-400 shadow-sm ring-1 ring-blue-500/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Contributor
          </button>

          <button
            id="role-switch-admin"
            onClick={() => onChangeRole("Admin")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium text-xs cursor-pointer ${
              currentRole === "Admin"
                ? "bg-amber-600/20 text-amber-500 shadow-sm ring-1 ring-amber-500/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Account
          </button>
        </div>
      </div>
    </div>
  );
}
