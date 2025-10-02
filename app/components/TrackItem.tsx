"use client";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface TrackItemProps {
  title: string;
  artist: string;
  picture?: string;
  isActive: boolean;
  isCustom: boolean;
  onClick: () => void;
  onRemove?: () => void;
  onCopy?: () => void;
}

export default function TrackItem({
  title,
  artist,
  picture,
  isActive,
  isCustom,
  onClick,
  onRemove,
  onCopy,
}: TrackItemProps) {
  return (
    <div
      className={`p-2 rounded-lg flex items-center gap-2 justify-between cursor-pointer ${
        isActive
          ? "bg-green-500"
          : "bg-gray-700 text-gray-200 hover:bg-gray-600"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center w-full gap-2">
        <img
          src={picture ?? "/default-cover.png"}
          alt="cover"
          className="w-12 h-12 rounded-sm object-cover"
        />
        <div className="flex flex-col text-sm flex-1 min-w-0">
          <span className="whitespace-normal sm:truncate">{title}</span>
          <span className="text-gray-300 truncate">{artist}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="p-1 text-gray-300 hover">
            <MoreVertical size={18} />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 bg-gray-800 border-0">
          {isCustom && (
            <DropdownMenuItem
              className="text-red-400 focus:bg-gray-700 focus:text-red-200"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
            >
              Remove
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-blue-400 focus:bg-gray-700 focus:text-blue-200"
            onClick={(e) => {
              e.stopPropagation();
              onCopy?.();
            }}
          >
            Copy Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
