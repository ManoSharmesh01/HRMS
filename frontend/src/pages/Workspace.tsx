import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Info,
  User,
  Clock,
  MapPin,
  Sparkles,
  X
} from 'lucide-react';
import { ListSkeleton } from '../components/common/Skeleton';

interface CalendarItem {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: string;
  category: 'event' | 'leave';
  reason?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Workspace() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  const { data: calendarData, isLoading } = useQuery<CalendarItem[]>({
    queryKey: ['calendarData'],
    queryFn: async () => {
      const response = await api.get('/calendar/data');
      return response.data;
    }
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();
  const days = [];

  // Padding for previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      currentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      currentMonth: true
    });
  }

  // Padding for next month
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      currentMonth: false
    });
  }

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getItemsForDate = (d: number, m: number, y: number) => {
    if (!calendarData) return [];
    return calendarData.filter(item => {
      const itemDate = new Date(item.date);
      const isSameDay = itemDate.getDate() === d && itemDate.getMonth() === m && itemDate.getFullYear() === y;
      
      if (item.category === 'leave' && item.endDate) {
        const startDate = new Date(item.date);
        const endDate = new Date(item.endDate);
        const checkDate = new Date(y, m, d);
        return checkDate >= startDate && checkDate <= endDate;
      }
      
      return isSameDay;
    });
  };

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'HOLIDAY': return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/20';
      case 'MEETING': return 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20';
      case 'LEAVE': return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-indigo-500 dark:text-indigo-400 animate-pulse" size={28} />
            Workplace Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visualize corporate schedules, upcoming events, and employee leaves</p>
        </div>

        <div className="flex items-center bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-1 shadow-glass-sm">
           <button 
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"
           >
             <ChevronLeft size={20} />
           </button>
           <button 
            onClick={goToToday}
            className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
           >
             Today
           </button>
           <button 
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"
           >
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="xl:col-span-3">
          <div className="glass-panel rounded-3xl overflow-hidden border border-black/5 dark:border-white/5 shadow-glass">
            <div className="p-6 border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                 {MONTHS[month]} <span className="text-indigo-500 font-medium">{year}</span>
               </h2>
               <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <span className="text-slate-500">Holidays</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="text-slate-500">Meetings</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-500">Leaves</span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-7">
              {DAYS.map(day => (
                <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-black/5 dark:border-white/5">
                  {day}
                </div>
              ))}

              {isLoading ? (
                <div className="col-span-7 p-12 flex justify-center">
                   <ListSkeleton items={5} />
                </div>
              ) : (
                days.map((dateObj, idx) => {
                  const items = getItemsForDate(dateObj.day, dateObj.month, dateObj.year);
                  const isToday = new Date().toDateString() === new Date(dateObj.year, dateObj.month, dateObj.day).toDateString();

                  return (
                    <div 
                      key={idx} 
                      className={`min-h-[120px] p-2 border-r border-b border-black/5 dark:border-white/5 transition-colors ${
                        dateObj.currentMonth ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-900/20 text-slate-300 dark:text-slate-700'
                      } ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg ${ 
                          isToday ? 'bg-indigo-500 text-white shadow-lg' : 
                          dateObj.currentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-700'
                        }`}>
                          {dateObj.day}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left px-2 py-1 rounded-md text-[10px] font-bold truncate border transition-all hover:scale-[1.02] active:scale-95 ${
                              getTypeColor(item.type)
                            }`}
                          >
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Detailed View Placeholder */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600">
                <Info size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Schedule Overview</h3>
            </div>
            
            {!selectedItem ? (
              <div className="py-8 text-center">
                <CalendarIcon size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 px-4">Click on any calendar marker to view detailed schedule information.</p>
              </div>
            ) : (
              <div className="animate-slide-up space-y-5">
                <div className={`p-4 rounded-2xl border ${getTypeColor(selectedItem.type)}`}>
                   <p className="text-xs font-bold uppercase tracking-wider mb-1">{selectedItem.category}</p>
                   <h4 className="text-lg font-extrabold leading-tight">{selectedItem.title}</h4>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-sm">
                     <Clock size={16} className="text-slate-400" />
                     <div className="flex flex-col">
                       <span className="text-xs text-slate-400">Date Range</span>
                       <span className="font-semibold text-slate-700 dark:text-slate-300">
                         {new Date(selectedItem.date).toLocaleDateString()} 
                         {selectedItem.endDate ? ` - ${new Date(selectedItem.endDate).toLocaleDateString()}` : ''}
                       </span>
                     </div>
                   </div>

                   {selectedItem.reason && (
                     <div className="flex items-start gap-3 text-sm">
                       <Info size={16} className="text-slate-400 mt-1" />
                       <div className="flex flex-col">
                         <span className="text-xs text-slate-400">Reason/Description</span>
                         <span className="text-slate-700 dark:text-slate-300 italic">"{selectedItem.reason}"</span>
                       </div>
                     </div>
                   )}

                   {selectedItem.type === 'MEETING' && (
                     <div className="flex items-center gap-3 text-sm">
                       <MapPin size={16} className="text-slate-400" />
                       <div className="flex flex-col">
                         <span className="text-xs text-slate-400">Location</span>
                         <span className="text-slate-700 dark:text-slate-300 font-medium">Main Conference Room</span>
                       </div>
                     </div>
                   )}

                   {selectedItem.category === 'leave' && (
                     <div className="flex items-center gap-3 text-sm">
                       <User size={16} className="text-slate-400" />
                       <div className="flex flex-col">
                         <span className="text-xs text-slate-400">Employee Status</span>
                         <span className="text-emerald-600 font-bold">Approved</span>
                       </div>
                     </div>
                   )}
                </div>

                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition-all"
                >
                  <X size={16} />
                  Dismiss Details
                </button>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-black/5 dark:border-white/5 bg-indigo-500/5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CalendarIcon size={16} className="text-indigo-500" />
              Month Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Holidays</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {calendarData?.filter(i => i.type === 'HOLIDAY' && new Date(i.date).getMonth() === month).length || 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Leaves</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {calendarData?.filter(i => i.category === 'leave' && new Date(i.date).getMonth() === month).length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}