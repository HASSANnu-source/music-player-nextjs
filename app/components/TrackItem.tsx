"use client";

import { MoreVertical, Heart, Copy, Trash2 } from "lucide-react";
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
  currentPlaylistName: string;
  onClick: () => void;
  onRemove?: () => void;
  AddToFavorite: () => void;
  RemoveFromFavorite: () => void;
  onCopy?: () => void;
  isFavorite: boolean;
}

export default function TrackItem({
  title,
  artist,
  picture,
  isActive,
  currentPlaylistName,
  onClick,
  onRemove,
  AddToFavorite,
  RemoveFromFavorite,
  onCopy,
  isFavorite,
}: TrackItemProps) {
  return (
    <div
      className={`p-2 rounded-lg flex items-center gap-2 justify-between cursor-pointer ${isActive
        ? "bg-green-500"
        : "bg-gray-700 text-gray-200 hover:bg-gray-600"
        }`}
      onClick={onClick}
    >
      <div className="flex items-center w-full gap-2">
        <img
          src={picture ?? "./default-cover.png"}
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
        <DropdownMenuContent align="end" className="bg-gray-800 border-0">
          <DropdownMenuItem
            className="text-blue-400 focus:bg-gray-700 focus:text-blue-200"
            onClick={(e) => {
              e.stopPropagation();
              onCopy?.();
            }}
          >
            <Copy />
            Copy Link
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-gray-300 focus:bg-gray-700 focus:text-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              isFavorite ? RemoveFromFavorite() : AddToFavorite();
            }}
          >
            <Heart fill={`${isFavorite ? "red" : "none"}`} strokeWidth={`${isFavorite ? "0" : "2"}`} />
            {isFavorite ? "Remove from favorite" : "Add to favorite"}
          </DropdownMenuItem>

          {(currentPlaylistName !== "Pop" && currentPlaylistName !== "Peace" && currentPlaylistName !== "Favorite") && (
            <DropdownMenuItem
              className="text-red-400 focus:bg-gray-700 focus:text-red-200"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
            >
              <Trash2 />
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}