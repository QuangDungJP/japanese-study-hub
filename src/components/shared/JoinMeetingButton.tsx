import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { buildMeetingRoomUrl, normalizeMeetingUrl } from '@/lib/meetingLink';

interface JoinMeetingButtonProps {
  url?: string | null;
  title?: string;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** ẩn nút mở tab mới */
  hideExternal?: boolean;
}

/**
 * Nút vào lớp all-in-one: mở phòng học ngay trong website,
 * kèm nút phụ mở tab riêng như trước đây.
 */
export const JoinMeetingButton = ({
  url,
  title,
  label = 'Vào lớp',
  size = 'sm',
  className = '',
  variant = 'default',
  hideExternal = false,
}: JoinMeetingButtonProps) => {
  if (!url) return null;
  const href = normalizeMeetingUrl(url);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Button asChild size={size} variant={variant} className="rounded-xl font-bold gap-1.5">
        <Link to={buildMeetingRoomUrl(href, title)}>
          <Video className="w-4 h-4" /> {label}
        </Link>
      </Button>
      {!hideExternal && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="icon" variant="outline" className="rounded-xl h-8 w-8 shrink-0">
              <a href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mở tab riêng</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default JoinMeetingButton;