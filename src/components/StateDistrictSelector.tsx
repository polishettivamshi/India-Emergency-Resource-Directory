import React, { useEffect } from "react";
import { INDIA_STATES_AND_DISTRICTS } from "../types";
import { MapPin } from "lucide-react";

interface StateDistrictSelectorProps {
  selectedState: string;
  selectedDistrict: string;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  darkMode?: boolean;
}

export default function StateDistrictSelector({
  selectedState,
  selectedDistrict,
  onStateChange,
  onDistrictChange,
  darkMode = false
}: StateDistrictSelectorProps) {
  const states = Object.keys(INDIA_STATES_AND_DISTRICTS);
  const districts = selectedState ? INDIA_STATES_AND_DISTRICTS[selectedState] || ["All Districts"] : ["All Districts"];

  // If selected state changes, and current district isn't compatible, reset district selection
  useEffect(() => {
    if (selectedState && districts.length > 0 && !districts.includes(selectedDistrict) && selectedDistrict !== "All" && selectedDistrict !== "All Districts") {
      onDistrictChange(districts[0] === "All Districts" ? "All" : districts[0]);
    }
  }, [selectedState]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* State Picker */}
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          State/Territory
        </label>
        <div className="relative">
          <select
            id="search-state-select"
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none transition-all appearance-none cursor-pointer ${
              darkMode 
                ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 hover:border-slate-600" 
                : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 hover:border-slate-300"
            }`}
          >
            <option value="All">All of India</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-sky-500">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <div className={`absolute inset-y-0 right-3 flex items-center pointer-events-none ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            ▼
          </div>
        </div>
      </div>

      {/* District Picker */}
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          District/City
        </label>
        <div className="relative">
          <select
            id="search-district-select"
            value={selectedDistrict}
            disabled={selectedState === "All"}
            onChange={(e) => onDistrictChange(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none transition-all appearance-none cursor-pointer ${
              selectedState === "All" 
                ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" 
                : darkMode 
                  ? "bg-slate-900 border-slate-700 text-slate-100 hover:border-slate-600" 
                  : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
            }`}
          >
            <option value="All">All Districts</option>
            {districts.map((dst) => (
              <option key={dst} value={dst}>
                {dst}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-emerald-500">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <div className={`absolute inset-y-0 right-3 flex items-center pointer-events-none ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            ▼
          </div>
        </div>
      </div>
    </div>
  );
}
