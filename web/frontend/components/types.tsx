export interface BadgeOption {
    id: string;
    source: string;
    alt: string;
    title: string;
    description: string | null;
}

export interface BadgesSelectProps {
    options: BadgeOption[];
    selectedId: string;
    onChange: (id: string) => void;
}
