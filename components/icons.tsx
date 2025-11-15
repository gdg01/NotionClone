import React from 'react';

// Adjusted SVG props for better default styling control
type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

const defaultProps: IconProps = {
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const AddPageIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" x2="12" y1="18" y2="12"></line><line x1="9" x2="15" y1="15" y2="15"></line></svg>
);

export const PageIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="m9 18 6-6-6-6"></path></svg>
);

export const MenuIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
);

export const TextIcon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><path d="M17 6.1H7a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4Z"></path><path d="M7 16.1v4"></path><path d="M17 16.1v4"></path></svg>
);

export const Heading1Icon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M17 18v-7h4"></path><path d="M21 6.5V11"></path></svg>
);

export const Heading2Icon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"></path></svg>
);

export const Heading3Icon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M17.5 10.5c1.5-1.5 1.5-2.5 0-4-1.5-1.5-2.5-1.5-4 0"></path><path d="M17.5 17.5c1.5 1.5 1.5 2.5 0 4-1.5 1.5-2.5 1.5-4 0"></path></svg>
);

export const ListIcon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><line x1="8" x2="21" y1="6" y2="6"></line><line x1="8" x2="21" y1="12" y2="12"></line><line x1="8" x2="21" y1="18" y2="18"></line><line x1="3" x2="3.01" y1="6" y2="6"></line><line x1="3" x2="3.01" y1="12" y2="12"></line><line x1="3" x2="3.01" y1="18" y2="18"></line></svg>
);

export const ListOrderedIcon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><line x1="10" x2="21" y1="6" y2="6"></line><line x1="10" x2="21" y1="12" y2="12"></line><line x1="10" x2="21" y1="18" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
);

export const CalloutIcon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><path d="M12 8V4H8"/><rect x="4" y="12" width="16" height="8" rx="2"/><path d="M8 12v-2a4 4 0 0 1 4-4h4"/></svg>
);

export const CodeIcon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
);

export const SunIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
);

export const MoonIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
);

export const NewPageIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
);

export const ChevronDoubleLeftIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="m6 9 6 6 6-6"/></svg>
);

export const DragIcon = (props: IconProps) => (
    // Override fill for this specific icon
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
        <circle cx="9" cy="6" r="1.2" />
        <circle cx="15" cy="6" r="1.2" />
        <circle cx="9" cy="12" r="1.2" />
        <circle cx="15" cy="12" r="1.2" />
        <circle cx="9" cy="18" r="1.2" />
        <circle cx="15" cy="18" r="1.2" />
    </svg>
);

export const LinkIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
);

export const RefreshCwIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
);

export const QuoteIcon = (props: IconProps) => (
    <svg {...defaultProps} {...props}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 7 4 8 7 8Z"></path><path d="M14 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 7 4 8 7 8Z"></path></svg>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

// --- NUOVA ICONA ---
export const XIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export const SaveIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);

export const TimerIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export const PlayIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props} fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

export const PauseIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props} fill="currentColor" stroke="none">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);

export const SettingsIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export const BoldIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
);

export const ItalicIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
);

// Icona specifica per il "codice inline" (<>)
export const InlineCodeIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);

export const SparkleIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M12 2L14.33 6.67L19 9L14.33 11.33L12 16L9.67 11.33L5 9L9.67 6.67L12 2Z" fill="currentColor" stroke="none" /></svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

export const FileTextIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>
);

export const GlobeIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
);

export const SplitIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}> <rect width="18" height="18" x="3" y="3" rx="2" /><line x1="15" x2="15" y1="3" y2="21" /></svg>
);
export const FilterIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}> <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

// Correzione per PlusIcon

export const PlusIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}><path d="M12 5v14M5 12h14" /></svg>
);

export const Image = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
    <circle cx="9" cy="9" r="2"></circle>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
  </svg>
);

export const Tag = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <path d="M12.586 2.586a2 2 0 0 0-2.828 0L2.586 9.757a2 2 0 0 0 0 2.828l7.172 7.172a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828L12.586 2.586z"></path>
    <circle cx="16" cy="8" r="1"></circle>
</svg>
);

export const PinIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

export const PinOffIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

export const CopyIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

export const EyeOffIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);


// --- NUOVA ICONA TASK ---
export const CheckSquareIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <path d="M9 11l3 3L22 4"></path>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

export const MoreHorizontalIcon = (props: IconProps) => (
  <svg {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="19" cy="12" r="1"></circle>
    <circle cx="5" cy="12" r="1"></circle>
  </svg>
);

export const CircleDottedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props: IconProps) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" strokeDasharray="2 4" />
    </svg>
);

export const CircleHalfIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props: IconProps) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor" stroke="none" />
        <path d="M12 2a10 10 0 0 1 0 20z" />
    </svg>
);

export const CircleFilledIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props: IconProps) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
    </svg>
);


export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props: IconProps) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
    </svg>
);

export const TagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props} // Applica 'className' e altri props SVG
    >
      <path d="M12 2H2v10l10 10 10-10L12 2z" />
      <path d="M7 7h.01" />
    </svg>
  );
};

export const NumberIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M8.21 4.418a.75.75 0 0 0-1.022.285L5.33 7.5H3.75a.75.75 0 0 0 0 1.5h1.338l-1.06 1.838a.75.75 0 1 0 1.298.748L6.388 9.5h2.89l-1.06 1.838a.75.75 0 1 0 1.298.748l1.06-1.838h1.674a.75.75 0 0 0 0-1.5h-1.428l1.858-3.219a.75.75 0 1 0-1.298-.748L10.388 8H7.5l1.06-1.838a.75.75 0 0 0-.35-1.022.753.753 0 0 0-.001-.001l-.001-.001ZM9.612 8l-1.06 1.838a.75.75 0 1 0 1.298.748L10.91 8.5H9.613l-.001-.002Z" />
  </svg>
);

export const SelectIcon: React.FC<IconProps> = (props: IconProps) => ( // ChevronDown
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M3.78 5.78a.75.75 0 0 0 0 1.06l4 4a.75.75 0 0 0 1.06 0l4-4a.75.75 0 0 0-1.06-1.06L8.25 9.19 4.84 5.78a.75.75 0 0 0-1.06 0Z" />
  </svg>
);

export const MultiSelectIcon: React.FC<IconProps> = (props: IconProps) => ( // CheckSquare
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 12.25v-8.5A1.75 1.75 0 0 0 12.25 2H3.75ZM3.5 3.75a.25.25 0 0 1 .25-.25h8.5a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-8.5Zm3.5 2a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Zm3 0a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z" />
  </svg>
);

export const StatusIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M8 3a.75.75 0 0 0-1.494.102A5.001 5.001 0 0 0 3.102 6.506a.75.75 0 0 0 1.494.102A3.501 3.501 0 0 1 8 4.5a3.501 3.501 0 0 1 3.404 2.108.75.75 0 0 0 1.493-.102A5.001 5.001 0 0 0 9.494 3.102.75.75 0 0 0 8 3ZM3.102 9.494A5.001 5.001 0 0 0 6.506 12.898a.75.75 0 0 0 .102-1.494A3.501 3.501 0 0 1 4.5 8a3.501 3.501 0 0 1 2.108-3.404.75.75 0 0 0-.102-1.493A5.001 5.001 0 0 0 3.102 6.506v2.988Zm9.796 0A5.001 5.001 0 0 0 9.494 3.102a.75.75 0 0 0-.102 1.493A3.501 3.501 0 0 1 11.5 8a3.501 3.501 0 0 1-2.108 3.404.75.75 0 0 0 .102 1.493A5.001 5.001 0 0 0 12.898 9.494Z" />
  </svg>
);

export const DateIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M4.75 3a.75.75 0 0 0-1.5 0V4H2.75A1.75 1.75 0 0 0 1 5.75v6.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 14 12.25v-6.5A1.75 1.75 0 0 0 12.25 4H11.5V3a.75.75 0 0 0-1.5 0V4H6.25V3a.75.75 0 0 0-1.5 0V4H4.75V3Zm-2 4.25h10.5a.25.25 0 0 1 .25.25v1a.75.75 0 0 0 1.5 0v-1c0-.966-.784-1.75-1.75-1.75H2.75A1.75 1.75 0 0 0 1 5.75v1a.75.75 0 0 0 1.5 0v-1a.25.25 0 0 1 .25-.25Z" />
  </svg>
);

export const PersonIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M8 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM9.5 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    <path d="M2.5 12.25a.75.75 0 0 0 0 1.5h11a.75.75 0 0 0 0-1.5h-11Zm0-1.5A2.25 2.25 0 0 1 4.75 8.5h6.5A2.25 2.25 0 0 1 13.5 10.75v.75a.75.75 0 0 0 1.5 0v-.75A3.75 3.75 0 0 0 11.25 7H4.75A3.75 3.75 0 0 0 1 10.75v.75a.75.75 0 0 0 1.5 0v-.75Z" />
  </svg>
);

export const FilesIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M6.25 3a.75.75 0 0 0-1.5 0v8.19l-.72-.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l2-2a.75.75 0 0 0-1.06-1.06l-.72.72V3.75A2.25 2.25 0 0 1 8.5 1.5h3.75a.75.75 0 0 0 0-1.5H8.5A3.75 3.75 0 0 0 4.75 3.75V11.19l-.72-.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l2-2a.75.75 0 1 0-1.06-1.06l-.72.72V3Z" />
    <path d="M12.25 3.5A2.25 2.25 0 0 0 10 5.75v6.5a.75.75 0 0 0 1.5 0v-6.5a.75.75 0 0 1 .75-.75h.25a.75.75 0 0 0 0-1.5h-.25Z" />
  </svg>
);

export const CheckboxIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 12.25v-8.5A1.75 1.75 0 0 0 12.25 2H3.75ZM3.5 3.75a.25.25 0 0 1 .25-.25h8.5a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-8.5Z" />
    <path d="M6.53 7.53a.75.75 0 0 0-1.06 1.06l1.22 1.22a.75.75 0 0 0 1.06 0l3-3a.75.75 0 0 0-1.06-1.06L7.22 8.19 6.53 7.53Z" />
  </svg>
);

export const URLIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M6.25 3a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0V3ZM3 5.75A2.25 2.25 0 0 1 5.25 3.5h.25a.75.75 0 0 0 0-1.5H5.25A3.75 3.75 0 0 0 1.5 5.75v4.5A3.75 3.75 0 0 0 5.25 14h.25a.75.75 0 0 0 0-1.5H5.25A2.25 2.25 0 0 1 3 10.25v-4.5ZM9.75 13a.75.75 0 0 0 1.5 0v-1.5a.75.75 0 0 0-1.5 0V13Zm1.5-8.75A2.25 2.25 0 0 1 10.5 2h-.25a.75.75 0 0 0 0 1.5h.25A3.75 3.75 0 0 0 14.5 7.25v1.5A3.75 3.75 0 0 0 10.75 12h-.25a.75.75 0 0 0 0 1.5h.25A2.25 2.25 0 0 1 13 8.75v-1.5Z" />
  </svg>
);

export const EmailIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M8 1.5A6.5 6.5 0 1 0 8 14.5 6.5 6.5 0 0 0 8 1.5ZM3.065 8A4.986 4.986 0 0 1 8 3.014v9.972A4.986 4.986 0 0 1 3.065 8ZM8 12.25a.75.75 0 0 0 .75-.75V8.814a.5.5 0 0 0-.5-.5H6.5a.75.75 0 0 0 0 1.5h.75v1.686A4.25 4.25 0 0 1 4.5 8c0-1.8.188-2.62 1.077-3.328A3.001 3.001 0 0 1 8 4.5a3 3 0 0 1 3 3 .75.75 0 0 0 1.5 0 4.5 4.5 0 1 0-4.5 4.5v.75a.75.75 0 0 0 .75.75Z" />
  </svg>
);

export const PhoneIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M4.68 3.204a.75.75 0 0 0-1.02.26L2.348 5.61a.75.75 0 0 0 .26 1.02l2.306 1.393a.75.75 0 0 0 .79-.11L7.5 6.44l-1.47-1.47-1.35-.765Zm.69 4.697L3.978 6.51l-1.39-1.39a2.25 2.25 0 0 1-.78-3.06l1.31-2.146a2.25 2.25 0 0 1 3.06-.78l2.146 1.31A2.25 2.25 0 0 1 7.5 6.495l-1.392 1.39a.75.75 0 0 0-.738.016ZM9.5 7.5l-1.47 1.47-1.35.765a.75.75 0 0 0 .11.79l1.393 2.306a.75.75 0 0 0 1.02.26l2.146-1.312a.75.75 0 0 0 .26-1.02L10.06 8.34a.75.75 0 0 0-.56-.84Zm-1.39 1.39 1.39-1.39a2.25 2.25 0 0 1 3.06-.78l2.146 1.31a2.25 2.25 0 0 1 .78 3.06l-1.31 2.146a2.25 2.25 0 0 1-3.06.78l-2.146-1.31a2.25 2.25 0 0 1-.78-3.06Z" />
  </svg>
);

export const FormulaIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M2.75 3a.75.75 0 0 0-1.5 0v1.5h1.5V3Zm0 8.5h-1.5V13a.75.75 0 0 0 1.5 0v-1.5Zm10.5 1.5a.75.75 0 0 0 1.5 0v-1.5h-1.5v1.5ZM4.25 3H12a.75.75 0 0 0 0-1.5H4.25V3Zm8.25 5.5a.75.75 0 0 0 0 1.5H13a.75.75 0 0 0 0-1.5h-.5Zm-1 2.75a.75.75 0 0 0-1.5 0v.5h-5.5a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5h-.5v-.5Z" />
  </svg>
);

export const RelationIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M1.75 4.5a.75.75 0 0 0 0 1.5h4.25v.75a.75.75 0 0 0 1.5 0v-.75h1.25a2.25 2.25 0 0 1 2.25 2.25v2.75h-.75a.75.75 0 0 0 0 1.5h.75v.75a.75.75 0 0 0 1.5 0v-.75h.75a.75.75 0 0 0 0-1.5h-.75V8.5A3.75 3.75 0 0 0 8.75 4.75H7.5v-.75a.75.75 0 0 0-1.5 0v.75H1.75a.75.75 0 0 0 0-1.5h4.25V3a.75.75 0 0 0-1.5 0v.75H1.75a.75.75 0 0 0 0 1.5Z" />
  </svg>
);

export const RollupIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M8 2.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0V2.5ZM2.5 8a.75.75 0 0 0 0-1.5H3.25a.75.75 0 0 0 0 1.5H2.5Zm11.25-1.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0V6.5Z" />
    <path d="M8 4.5A3.5 3.5 0 1 0 8 11.5 3.5 3.5 0 0 0 8 4.5ZM9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    <path d="M4.97 4.97a.75.75 0 0 0-1.06-1.06l-.53.53a.75.75 0 0 0 1.06 1.06l.53-.53Zm-1.06 7.12.53.53a.75.75 0 1 0 1.06-1.06l-.53-.53a.75.75 0 0 0-1.06 1.06Zm7.12 1.06.53-.53a.75.75 0 1 0-1.06-1.06l-.53.53a.75.75 0 0 0 1.06 1.06Zm1.06-7.12-.53-.53a.75.75 0 0 0-1.06 1.06l.53.53a.75.75 0 0 0 1.06-1.06Z" />
    <path d="M10.151 10.682a.75.75 0 0 0 1.06 1.06l2.03-2.03a.75.75 0 0 0 0-1.06l-2.03-2.03a.75.75 0 1 0-1.06 1.06L11.56 9.12l-1.41 1.41v.15Z" />
  </svg>
);

export const ButtonIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
     <path d="M4.75 3A1.75 1.75 0 0 0 3 4.75v6.5c0 .966.784 1.75 1.75 1.75h6.5A1.75 1.75 0 0 0 13 11.25v-6.5A1.75 1.75 0 0 0 11.25 3H4.75ZM4.5 4.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v6.5a.25.25 0 0 1-.25.25h-6.5a.25.25 0 0 1-.25-.25v-6.5Zm3.303 3.22L6.15 9.623a.75.75 0 1 0 1.298.75l1.088-1.885 1.06 1.838a.75.75 0 1 0 1.298-.748L9.83 7.738l.648-.374a.75.75 0 0 0-.374-1.298l-2.09.21a.75.75 0 0 0-.626.626l-.21 2.09a.75.75 0 0 0 1.298.374l.32-.553Z" />
  </svg>
);

export const IDIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
     <path d="M3.75 3A.75.75 0 0 0 3 3.75v8.5a.75.75 0 0 0 1.5 0V9.5h.75a.75.75 0 0 0 0-1.5H4.5V3.75A.75.75 0 0 0 3.75 3ZM8.5 3.75A.75.75 0 0 0 7 4.5v.75H6.25a.75.75 0 0 0 0 1.5h.75v2.5h-.75a.75.75 0 0 0 0 1.5h.75V12a.75.75 0 0 0 1.5 0V9.5h2V12a.75.75 0 0 0 1.5 0V4.5a.75.75 0 0 0-1.5 0v.75h-2V4.5A.75.75 0 0 0 8.5 3.75Zm2 4.25V9.5h-2V8h2Z" />
     <path d="M12.5 3.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm0 3.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
  </svg>
);

export const PlaceIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
     <path d="M8.06.75a.75.75 0 0 0-1.06 0l-5.5 5.5a.75.75 0 0 0 0 1.06l5.5 5.5a.75.75 0 0 0 1.06 0l5.5-5.5a.75.75 0 0 0 0-1.06l-5.5-5.5ZM3.62 7.25l4.44-4.44 4.44 4.44-4.44 4.44-4.44-4.44Z" />
     <path d="M8 5.75A2.25 2.25 0 1 0 8 10.25 2.25 2.25 0 0 0 8 5.75ZM9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
  </svg>
);


export const Aa: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M5.39205 42.4727H-3.23762e-07L15.5955 -5.20185e-08H20.9045L36.5 42.4727H31.108L18.4159 6.71932H18.0841L5.39205 42.4727ZM7.38295 25.8818H29.117V30.4443H7.38295V25.8818ZM51.8258 43.2193C49.8073 43.2193 47.9754 42.8391 46.3301 42.0787C44.6848 41.3045 43.3783 40.1915 42.4105 38.7398C41.4427 37.2742 40.9588 35.5045 40.9588 33.4307C40.9588 31.6057 41.3183 30.1263 42.0372 28.9926C42.7562 27.8451 43.717 26.9464 44.9199 26.2966C46.1227 25.6468 47.45 25.1629 48.9017 24.8449C50.3672 24.5131 51.8397 24.2504 53.319 24.0568C55.2546 23.808 56.8239 23.6213 58.0267 23.4969C59.2434 23.3586 60.1282 23.1305 60.6812 22.8125C61.2481 22.4945 61.5315 21.9415 61.5315 21.1534V20.9875C61.5315 18.9413 60.9716 17.3513 59.8517 16.2176C58.7456 15.0839 57.0658 14.517 54.8122 14.517C52.4757 14.517 50.6437 15.0286 49.3165 16.0517C47.9892 17.0748 47.056 18.167 46.5168 19.3284L41.8713 17.6693C42.7008 15.7337 43.8069 14.2267 45.1895 13.1483C46.5859 12.0561 48.1067 11.2956 49.752 10.867C51.4111 10.4246 53.0425 10.2034 54.6463 10.2034C55.6694 10.2034 56.8446 10.3278 58.1719 10.5767C59.513 10.8117 60.8057 11.3026 62.05 12.0491C63.3081 12.7957 64.352 13.9225 65.1815 15.4295C66.0111 16.9366 66.4258 18.9551 66.4258 21.4852V42.4727H61.5315V38.1591H61.2827C60.9508 38.8504 60.3978 39.5901 59.6236 40.3781C58.8493 41.1662 57.8193 41.8367 56.5335 42.3898C55.2477 42.9428 53.6785 43.2193 51.8258 43.2193ZM52.5724 38.8227C54.508 38.8227 56.1395 38.4425 57.4668 37.6821C58.8079 36.9217 59.8171 35.9401 60.4946 34.7372C61.1859 33.5344 61.5315 32.2693 61.5315 30.942V26.4625C61.3241 26.7114 60.8679 26.9395 60.1628 27.1469C59.4715 27.3404 58.6696 27.5133 57.7571 27.6653C56.8584 27.8036 55.9805 27.928 55.1233 28.0386C54.2799 28.1354 53.5955 28.2184 53.0702 28.2875C51.7982 28.4534 50.6092 28.723 49.5031 29.0963C48.4109 29.4558 47.526 30.0019 46.8486 30.7347C46.1849 31.4536 45.8531 32.4352 45.8531 33.6795C45.8531 35.3801 46.4822 36.6659 47.7403 37.5369C49.0123 38.3941 50.623 38.8227 52.5724 38.8227Z" fill="black"/>
  </svg>
);


export const EditIcon: React.FC<IconProps> = (props: IconProps) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path d="M6.25 3a.75.75 0 0 0-1.5 0v8.19l-.72-.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l2-2a.75.75 0 0 0-1.06-1.06l-.72.72V3.75A2.25 2.25 0 0 1 8.5 1.5h3.75a.75.75 0 0 0 0-1.5H8.5A3.75 3.75 0 0 0 4.75 3.75V11.19l-.72-.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l2-2a.75.75 0 1 0-1.06-1.06l-.72.72V3Z" />
    <path d="M12.25 3.5A2.25 2.25 0 0 0 10 5.75v6.5a.75.75 0 0 0 1.5 0v-6.5a.75.75 0 0 1 .75-.75h.25a.75.75 0 0 0 0-1.5h-.25Z" />
  </svg>
);

export const DotsHorizontalIcon = (props: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 ${props.className || ''}`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm5.25 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm5.25 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
    />
  </svg>
);