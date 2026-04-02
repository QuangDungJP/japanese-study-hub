import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

type LogoProps = Omit<LinkProps, "to"> & {
  imgClassName?: string;
  showText?: boolean;
  text?: string;
  alt?: string;
  to?: string;
};

const Logo = ({
  className,
  imgClassName,
  showText = false,
  text = "TNQDO",
  alt = "TNQDO",
  to = "/",
  ...props
}: LogoProps) => (
  <Link to={to} className={cn("inline-flex items-center gap-2", className)} {...props}>
    <img src="/logo.jpg" alt={alt} className={cn("w-10 h-10 rounded-xl object-cover", imgClassName)} />
    {showText ? <span className="text-xl font-bold text-foreground">{text}</span> : null}
  </Link>
);

export default Logo;
