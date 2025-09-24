import { Badge } from "@/components/ui/badge";

interface TagBadgesProps {
  tags?: string[];
  documentId: string;
  className?: string;
}

export function TagBadges({ tags, documentId, className = "" }: TagBadgesProps) {
  if (!tags || tags.length === 0) return null;
  
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="text-xs"
          data-testid={`tag-${tag.toLowerCase()}-${documentId}`}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}