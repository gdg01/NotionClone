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

export const CircleDottedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" strokeDasharray="2 4" />
    </svg>
);

export const CircleHalfIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor" stroke="none" />
        <path d="M12 2a10 10 0 0 1 0 20z" />
    </svg>
);

export const CircleFilledIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
    </svg>
);


export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
    </svg>
);