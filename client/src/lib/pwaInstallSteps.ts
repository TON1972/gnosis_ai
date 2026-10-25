import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CheckCircle2,
  ChevronsDown,
  Compass,
  Download,
  Globe,
  Home,
  Menu,
  MoreVertical,
  PanelBottom,
  PlusSquare,
  Share,
  Smartphone,
} from "lucide-react";

export type InstallPlatform = "android" | "ios";

export type InstallStep = {
  id: string;
  icon: LucideIcon;
};

export const ANDROID_INSTALL_STEPS: InstallStep[] = [
  { id: "openChrome", icon: Smartphone },
  { id: "openMenu", icon: MoreVertical },
  { id: "tapInstall", icon: Download },
  { id: "confirm", icon: CheckCircle2 },
];

export const ANDROID_MANUAL_STEPS: InstallStep[] = [
  { id: "openChrome", icon: Smartphone },
  { id: "openMenu", icon: Menu },
  { id: "tapAddHome", icon: PlusSquare },
  { id: "confirm", icon: CheckCircle2 },
];

export const IOS_INSTALL_STEPS: InstallStep[] = [
  { id: "openSafari", icon: Compass },
  { id: "openSite", icon: Globe },
  { id: "showToolbar", icon: PanelBottom },
  { id: "tapShare", icon: Share },
  { id: "scrollShare", icon: ChevronsDown },
  { id: "tapAddHome", icon: PlusSquare },
  { id: "confirm", icon: CheckCircle2 },
  { id: "findIcon", icon: Home },
];

export const PUSH_TIP_STEP: InstallStep = { id: "enablePush", icon: Bell };

export function detectDefaultPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "android";
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "ios";
  return "android";
}
