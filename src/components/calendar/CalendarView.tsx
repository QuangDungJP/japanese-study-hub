import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatTimeWithJST } from '@/lib/dateUtils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Video, FileText, Clock, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import JoinMeetingButton from '@/components/shared/JoinMeetingButton';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: 'booking' | 'exam' | 'leave' | 'reminder';
  description?: string;
  color?: string;
  meet_link?: string;
  reference_id?: string;
}

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void;
  showEventTypes?: ('booking' | 'exam' | 'leave' | 'reminder')[];
}

const eventColors: Record<string, string> = {
  booking: 'bg-blue-500',
  exam: 'bg-red-500',
  leave: 'bg-yellow-500',
  reminder: 'bg-green-500',
};

const eventIcons: Record<string, React.ElementType> = {
  booking: Video,
  exam: FileText,
  leave: UserX,
  reminder: Clock,
};

export const CalendarView = ({ onEventClick, showEventTypes = ['booking', 'exam', 'leave', 'reminder'] }: CalendarViewProps) => {
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
      const channel = supabase
        .channel('public:calendar-view-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchEvents)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'class_sessions' }, fetchEvents)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchEvents)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, fetchEvents)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, fetchEvents)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, fetchEvents)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_submissions' }, fetchEvents)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

      // Fetch class_sessions for enrolled classes or classes taught by teacher
      let classSessions: any[] = [];
      const [{ data: enrollments }, { data: taughtClasses }] = await Promise.all([
        supabase.from('class_students').select('class_id').eq('student_id', user?.id).eq('status', 'active'),
        supabase.from('classes').select('id').eq('teacher_id', user?.id),
      ]);

      const classIds = Array.from(new Set([
        ...(enrollments?.map(e => e.class_id) || []),
        ...(taughtClasses?.map(c => c.id) || []),
      ]));

      if (classIds.length > 0) {
        const { data: cSessions } = await supabase
          .from('class_sessions')
          .select('*, classes(name_vi, name)')
          .in('class_id', classIds)
          .gte('session_date', startDate)
          .lte('session_date', endDate);
        classSessions = cSessions || [];
      }

      // Fetch bookings for student or teacher
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, meetings(meet_link)')
        .or(`user_id.eq.${user?.id},teacher_id.eq.${user?.id}`)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate);

      // Fetch exams registered or directly scheduled
      const { data: examRegistrations } = await supabase
        .from('exam_registrations')
        .select('*, exams(*)')
        .eq('student_id', user?.id);

      const { data: directExams } = await supabase
        .from('exams')
        .select('*')
        .gte('exam_date', startDate)
        .lte('exam_date', endDate);

      // Fetch pending exam attempts / submissions for teacher grading reminders
      const { data: pendingAttempts } = await supabase
        .from('exam_attempts')
        .select('id, submitted_at, status, exam:exams(title_vi, title)')
        .in('status', ['submitted', 'pending'])
        .limit(20);

      // Fetch leave requests
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user?.id)
        .or(`start_date.gte.${startDate},end_date.lte.${endDate}`);

      const allEvents: CalendarEvent[] = [];

      // Map class sessions
      if (classSessions.length > 0 && showEventTypes.includes('booking')) {
        allEvents.push(...classSessions.map(cs => ({
          id: `session-${cs.id}`,
          title: cs.topic || cs.classes?.name_vi || 'Lớp học trực tuyến',
          start_time: `${cs.session_date}T${cs.start_time}`,
          end_time: `${cs.session_date}T${cs.end_time || cs.start_time}`,
          event_type: 'booking' as const,
          description: cs.notes || undefined,
          meet_link: cs.meet_link || undefined,
          reference_id: cs.id,
        })));
      }

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

      // Map exams to events (registrations + direct)
      if (showEventTypes.includes('exam')) {
        const addedExamIds = new Set<string>();

        if (examRegistrations) {
          examRegistrations.forEach(reg => {
            if (reg.exams) {
              const exam = reg.exams as any;
              addedExamIds.add(exam.id);
              allEvents.push({
                id: `exam-${exam.id}`,
                title: `📝 ${exam.title_vi || exam.title}`,
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

        if (directExams) {
          directExams.forEach(exam => {
            if (!addedExamIds.has(exam.id)) {
              allEvents.push({
                id: `exam-direct-${exam.id}`,
                title: `📝 ${exam.title_vi || exam.title}`,
                start_time: `${exam.exam_date}T${exam.start_time || '08:00'}`,
                end_time: `${exam.exam_date}T${exam.end_time || '10:00'}`,
                event_type: 'exam' as const,
                description: exam.description_vi || exam.description,
                meet_link: exam.meet_link,
                reference_id: exam.id,
              });
            }
          });
        }
      }

      // Map pending grading tasks (reminders)
      if (pendingAttempts && showEventTypes.includes('reminder')) {
        pendingAttempts.forEach(att => {
          if (att.submitted_at) {
            const dateStr = att.submitted_at.split('T')[0];
            allEvents.push({
              id: `grading-${att.id}`,
              title: `✍️ Cần chấm bài: ${att.exam?.title_vi || att.exam?.title || 'Bài thi'}`,
              start_time: `${dateStr}T10:00:00`,
              end_time: `${dateStr}T11:00:00`,
              event_type: 'reminder' as const,
              description: 'Bài nộp của học viên chờ giáo viên chấm điểm',
              reference_id: att.id,
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
                {type === 'booking' ? 'Lịch học' : type === 'exam' ? 'Kiểm tra' : type === 'leave' ? 'Nghỉ phép' : 'Nhắc nhở'}
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
                          {formatTimeWithJST(format(new Date(event.start_time), 'HH:mm'))}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {event.description}
                          </p>
                        )}
                        {event.meet_link && (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <JoinMeetingButton url={event.meet_link} title={event.title} label="Vào phòng" variant="outline" />
                          </div>
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
