import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Video, FileText, Clock, UserX, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: 'booking' | 'exam' | 'leave' | 'reminder' | 'class';
  description?: string;
  color?: string;
  meet_link?: string;
  reference_id?: string;
}

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void;
  showEventTypes?: ('booking' | 'exam' | 'leave' | 'reminder' | 'class')[];
}

const eventColors: Record<string, string> = {
  booking: 'bg-blue-500',
  exam: 'bg-red-500',
  leave: 'bg-yellow-500',
  reminder: 'bg-green-500',
  class: 'bg-purple-500',
};

const eventIcons: Record<string, React.ElementType> = {
  booking: Video,
  exam: FileText,
  leave: UserX,
  reminder: Clock,
  class: GraduationCap,
};

export const CalendarView = ({ onEventClick, showEventTypes = ['booking', 'exam', 'leave', 'reminder', 'class'] }: CalendarViewProps) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');

      // Fetch calendar events
      const { data: calendarEvents, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user?.id)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`);

      if (error) throw error;

      // Fetch bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, meetings(meet_link)')
        .eq('user_id', user?.id)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate);

      // Fetch exams for student
      const { data: examRegistrations } = await supabase
        .from('exam_registrations')
        .select('*, exams(*)')
        .eq('student_id', user?.id);

      // Fetch leave requests
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user?.id)
        .or(`start_date.gte.${startDate},end_date.lte.${endDate}`);

      const allEvents: CalendarEvent[] = [];

      // Map calendar events
      if (calendarEvents) {
        allEvents.push(...calendarEvents.map(e => ({
          id: e.id,
          title: e.title,
          start_time: e.start_time,
          end_time: e.end_time,
          event_type: e.event_type as CalendarEvent['event_type'],
          description: e.description || undefined,
          color: e.color || undefined,
          meet_link: e.meet_link || undefined,
          reference_id: e.reference_id || undefined,
        })));
      }

      // Map bookings to events
      if (bookings && showEventTypes.includes('booking')) {
        allEvents.push(...bookings.map(b => ({
          id: `booking-${b.id}`,
          title: `Học với ${b.teacher_name}`,
          start_time: `${b.booking_date}T${b.booking_time}`,
          end_time: `${b.booking_date}T${b.booking_time}`,
          event_type: 'booking' as const,
          description: b.notes || undefined,
          meet_link: b.meetings?.[0]?.meet_link,
          reference_id: b.id,
        })));
      }

      // Map exams to events
      if (examRegistrations && showEventTypes.includes('exam')) {
        examRegistrations.forEach(reg => {
          if (reg.exams) {
            const exam = reg.exams as any;
            allEvents.push({
              id: `exam-${exam.id}`,
              title: exam.title_vi || exam.title,
              start_time: `${exam.exam_date}T${exam.start_time}`,
              end_time: `${exam.exam_date}T${exam.start_time}`,
              event_type: 'exam' as const,
              description: exam.description_vi || exam.description,
              meet_link: exam.meet_link,
              reference_id: exam.id,
            });
          }
        });
      }

      // Map leave requests to events
      if (leaveRequests && showEventTypes.includes('leave')) {
        allEvents.push(...leaveRequests.map(l => ({
          id: `leave-${l.id}`,
          title: l.request_type === 'leave' ? 'Nghỉ phép' : 'Dời lịch',
          start_time: `${l.start_date}T00:00:00`,
          end_time: `${l.end_date}T23:59:59`,
          event_type: 'leave' as const,
          description: l.reason,
          reference_id: l.id,
        })));
      }

      // Map class sessions (visible to admin/teacher of class & enrolled students via RLS)
      if (showEventTypes.includes('class')) {
        const { data: sessions } = await (supabase as any)
          .from('class_sessions')
          .select('*, classes(name_vi, name, teacher_id)')
          .gte('session_date', startDate)
          .lte('session_date', endDate);
        if (sessions && sessions.length) {
          const teacherIds = [...new Set(sessions.map((s: any) => s.classes?.teacher_id).filter(Boolean))] as string[];
          let teacherMap = new Map<string, string>();
          if (teacherIds.length) {
            const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', teacherIds);
            teacherMap = new Map((profs || []).map((p: any) => [p.user_id, p.full_name || '']));
          }
          sessions.forEach((s: any) => {
            const cls = s.classes;
            const teacherName = cls?.teacher_id ? teacherMap.get(cls.teacher_id) : '';
            allEvents.push({
              id: `class-${s.id}`,
              title: `${cls?.name_vi || cls?.name || 'Lớp'}${s.topic ? ` · ${s.topic}` : ''}`,
              start_time: `${s.session_date}T${s.start_time}`,
              end_time: `${s.session_date}T${s.end_time || s.start_time}`,
              event_type: 'class' as const,
              description: [teacherName && `GV: ${teacherName}`, s.location, s.notes].filter(Boolean).join(' • '),
              meet_link: s.meet_link || undefined,
              reference_id: s.class_id,
            });
          });
        }
      }

      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, day);
    });
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hôm nay
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        {showEventTypes.map(type => {
          const Icon = eventIcons[type];
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-full', eventColors[type])} />
              <span className="text-muted-foreground capitalize">
                {type === 'booking' ? 'Lịch 1-1' : type === 'exam' ? 'Kiểm tra' : type === 'leave' ? 'Nghỉ phép' : type === 'class' ? 'Lớp học' : 'Nhắc nhở'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'min-h-[80px] p-1 rounded-lg border transition-all text-left',
                      isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                      isToday && 'ring-2 ring-primary',
                      isSelected && 'bg-primary/10 border-primary',
                      'hover:bg-muted/50'
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      !isCurrentMonth && 'text-muted-foreground',
                      isToday && 'text-primary'
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs px-1 py-0.5 rounded truncate text-white',
                            eventColors[event.event_type]
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3} khác
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, 'EEEE, dd/MM', { locale: vi })
                : 'Chọn ngày để xem chi tiết'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {selectedDate ? 'Không có sự kiện nào' : 'Chọn một ngày trên lịch'}
              </p>
            ) : (
              selectedDayEvents.map(event => {
                const Icon = eventIcons[event.event_type];
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg', eventColors[event.event_type])}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.start_time), 'HH:mm')}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {event.description}
                          </p>
                        )}
                        {event.meet_link && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(event.meet_link, '_blank');
                            }}
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Vào phòng
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
