import {
  Baby,
  Droplets,
  FlaskConical,
  HeartPulse,
  Pill,
  ScissorsLineDashed,
  ShieldPlus,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  Syringe,
  type LucideIcon,
  Flower2,
  Bath,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "material-medico": Syringe,
  galenicos: FlaskConical,
  "cuidado-personal": Bath,
  belleza: Sparkles,
  bebes: Baby,
  "cuidado-oral": Smile,
  "higiene-femenina": Flower2,
  "proteccion-solar": Sun,
  inyectables: Pill,
  "salud-sexual": HeartPulse,
  diagnostico: Stethoscope,
  "sueros-bebidas": Droplets,
  otc: ShieldPlus,
  suturas: ScissorsLineDashed,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Pill;
  return <Icon className={className} aria-hidden="true" />;
}
