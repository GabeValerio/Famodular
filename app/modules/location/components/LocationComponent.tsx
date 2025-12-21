import React, { useState } from 'react';
import { FamilyMember, Location } from '../types';
import { MapPin, Navigation, RefreshCw, Home, Briefcase, GraduationCap, TreePine } from 'lucide-react';

interface LocationComponentProps {
  members: FamilyMember[];
  currentUser: FamilyMember;
  onUpdateLocation: (memberId: string, location: Location) => Promise<void>;
}

const ZONES = [
  { name: 'Home', x: 50, y: 50, icon: <Home size={20} />, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Work', x: 20, y: 20, icon: <Briefcase size={20} />, color: 'bg-slate-100 text-slate-600' },
  { name: 'School', x: 80, y: 30, icon: <GraduationCap size={20} />, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Park', x: 70, y: 80, icon: <TreePine size={20} />, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Downtown', x: 25, y: 75, icon: <MapPin size={20} />, color: 'bg-rose-100 text-rose-600' },
];

export const LocationComponent: React.FC<LocationComponentProps> = ({ members, currentUser, onUpdateLocation }) => {
  const [updating, setUpdating] = useState(false);

  const handleUpdateLocation = async () => {
    setUpdating(true);

    // Simulate getting GPS location
    setTimeout(() => {
      // Randomly pick a zone or a random spot near a zone to simulate realistic movement
      const useZone = Math.random() > 0.3;
      let newLoc: Location;

      if (useZone) {
        const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
        newLoc = { x: zone.x, y: zone.y, label: zone.name, timestamp: new Date() };
      } else {
        newLoc = {
          x: Math.floor(Math.random() * 80) + 10,
          y: Math.floor(Math.random() * 80) + 10,
          label: 'On the go',
          timestamp: new Date()
        };
      }

      onUpdateLocation(currentUser.id, newLoc);
      setUpdating(false);
    }, 1500);
  };

  const getTimeString = (date?: Date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 60000);

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Family Tracker</h2>
          <p className="text-slate-500">See where everyone is in real-time.</p>
        </div>
        <button
          onClick={handleUpdateLocation}
          disabled={updating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Navigation size={18} className={updating ? "animate-spin" : ""} />
          {updating ? 'Locating...' : 'Update My Status'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2 bg-slate-100 rounded-2xl relative h-[500px] overflow-hidden border border-slate-200 shadow-inner group">
          {/* Map Pattern / Background */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          ></div>

          {/* Zones */}
          {ZONES.map((zone) => (
            <div
              key={zone.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/zone"
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            >
              <div className={`w-12 h-12 rounded-full ${zone.color} border-2 border-white shadow-sm flex items-center justify-center mb-2 z-0`}>
                {zone.icon}
              </div>
              <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-slate-600 shadow-sm border border-slate-100">
                {zone.name}
              </span>
            </div>
          ))}

          {/* Members */}
          {members.map((member) => {
             if (!member.location) return null;
             const isMe = member.id === currentUser.id;

             return (
               <div
                 key={member.id}
                 className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-in-out z-10"
                 style={{ left: `${member.location.x}%`, top: `${member.location.y}%` }}
               >
                 <div className="relative">
                   <img
                     src={member.avatar}
                     alt={member.name}
                     className={`w-12 h-12 rounded-full object-cover border-4 shadow-lg transition-transform hover:scale-110 ${isMe ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-white'}`}
                   />
                   {/* Online Indicator */}
                   <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                 </div>

                 <div className="mt-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-md border border-slate-100 flex flex-col items-center min-w-[100px]">
                    <span className="font-bold text-slate-800 text-xs">{member.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{member.location.label}</span>
                    <span className="text-[9px] text-slate-400">{getTimeString(member.location.timestamp)}</span>
                 </div>
               </div>
             );
          })}
        </div>

        {/* List View */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-[500px]">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-indigo-500" /> Locations
          </h3>

          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <img src={member.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt={member.name} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                     <div className="font-bold text-slate-800 text-sm">{member.name}</div>
                     <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                       {getTimeString(member.location?.timestamp)}
                     </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                     <MapPin size={12} className={member.location?.label === 'Home' ? 'text-indigo-500' : 'text-slate-400'} />
                     {member.location?.label || 'Unknown location'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 mt-2 border-t border-slate-100">
            <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3">
               <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                 <RefreshCw size={16} />
               </div>
               <div>
                 <h4 className="text-xs font-bold text-indigo-900 mb-1">Auto-Update Enabled</h4>
                 <p className="text-xs text-indigo-700 leading-relaxed">
                   Family members' locations update automatically when they open the app.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
