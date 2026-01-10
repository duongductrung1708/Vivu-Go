"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock,
  Coffee,
  Landmark,
  MapPin,
  ShoppingBag,
  Utensils,
  Edit2,
  Check,
  X,
  MapPinOff,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Tag,
  ChevronDown,
  Navigation,
  GripVertical,
} from "lucide-react";
import type { Place, TimeSlot } from "@/store/useTripStore";

type PlaceCardProps = {
  place: Place;
  timeLabel: string;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onUpdateCost?: (cost: number) => void;
  onUpdateName?: (name: string) => void;
  onUpdateTimeSlot?: (timeSlot: TimeSlot) => void;
  onUpdateCategory?: (category: Place["category"]) => void;
  onUpdateTime?: (time: string) => void;
  onRemoveLocation?: () => void;
  onShowNearbyPlaces?: () => void;
};

const CategoryIcon = ({ category }: { category: Place["category"] }) => {
  switch (category) {
    case "food":
      return <Utensils className="h-4 w-4 text-primary" />;
    case "coffee":
      return <Coffee className="h-4 w-4 text-primary" />;
    case "shopping":
      return <ShoppingBag className="h-4 w-4 text-primary" />;
    case "culture":
      return <Landmark className="h-4 w-4 text-primary" />;
    case "sightseeing":
      return <MapPin className="h-4 w-4 text-primary" />;
    default:
      return <MapPin className="h-4 w-4 text-primary" />;
  }
};

export function PlaceCard({
  place,
  timeLabel,
  isActive,
  onClick,
  onDelete,
  onUpdateCost,
  onUpdateName,
  onUpdateTimeSlot,
  onUpdateCategory,
  onUpdateTime,
  onRemoveLocation,
  onShowNearbyPlaces,
}: PlaceCardProps) {
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [costValue, setCostValue] = useState(place.estimatedCost.toString());
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(place.name);
  const [isEditingTimeSlot, setIsEditingTimeSlot] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState(place.specificTime || "");
  const timeSlotDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Sync nameValue with place.name when not editing
  if (!isEditingName && nameValue !== place.name) {
    setNameValue(place.name);
  }

  // Sync timeValue with place.specificTime when not editing
  if (!isEditingTime && timeValue !== (place.specificTime || "")) {
    setTimeValue(place.specificTime || "");
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timeSlotDropdownRef.current &&
        !timeSlotDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditingTimeSlot(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditingCategory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const timeSlotOptions: {
    value: TimeSlot;
    label: string;
    icon: typeof Sunrise;
  }[] = [
    { value: "morning", label: "Sáng", icon: Sunrise },
    { value: "noon", label: "Trưa", icon: Sun },
    { value: "afternoon", label: "Chiều", icon: Sunset },
    { value: "evening", label: "Tối", icon: Moon },
  ];

  const categoryOptions: {
    value: Place["category"];
    label: string;
    icon: typeof Utensils;
  }[] = [
    { value: "food", label: "Ẩm Thực", icon: Utensils },
    { value: "coffee", label: "Cà Phê", icon: Coffee },
    { value: "sightseeing", label: "Tham Quan", icon: MapPin },
    { value: "culture", label: "Văn Hóa", icon: Landmark },
    { value: "shopping", label: "Mua Sắm", icon: ShoppingBag },
    { value: "other", label: "Khác", icon: Tag },
  ];

  const handleSaveCost = () => {
    const cost = parseInt(costValue) || 0;
    onUpdateCost?.(cost);
    setIsEditingCost(false);
  };

  const handleCancelEdit = () => {
    setCostValue(place.estimatedCost.toString());
    setIsEditingCost(false);
  };

  const handleSaveName = () => {
    const trimmedName = nameValue.trim();
    if (trimmedName && trimmedName !== place.name) {
      onUpdateName?.(trimmedName);
    } else {
      setNameValue(place.name);
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setNameValue(place.name);
    setIsEditingName(false);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: dragTransition,
    isDragging,
  } = useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: dragTransition || undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onClick}
      whileHover={isDragging ? {} : { y: -2 }}
      whileTap={isDragging ? {} : { scale: 0.98 }}
      animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
      className={`group flex w-full cursor-pointer mt-4 flex-col rounded-3xl border bg-card/80 p-4 text-left shadow-sm transition-colors relative ${
        isActive
          ? "border-primary shadow-md"
          : "border-border hover:border-primary/50"
      } ${isDragging ? "z-50 shadow-lg" : ""}`}
    >
      {/* Drag Handle - Absolute positioned to not affect layout */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-0 top-7 cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 z-10"
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="mb-2 flex items-center justify-between gap-2">
        {isEditingTimeSlot ? (
          <div className="flex items-center gap-1.5" ref={timeSlotDropdownRef}>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTimeSlot(!isEditingTimeSlot);
                }}
                className="flex items-center gap-2 rounded-lg border-2 border-primary/50 bg-card px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {(() => {
                  const selected = timeSlotOptions.find(
                    (opt) => opt.value === place.timeSlot
                  );
                  const Icon = selected?.icon || Sunrise;
                  return (
                    <>
                      <Icon className="h-3 w-3" />
                      <span>{selected?.label || "Sáng"}</span>
                      <ChevronDown className="h-3 w-3" />
                    </>
                  );
                })()}
              </button>
              <AnimatePresence>
                {isEditingTimeSlot && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border-2 border-primary/50 bg-card shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {timeSlotOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateTimeSlot?.(option.value);
                            setIsEditingTimeSlot(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition ${
                            place.timeSlot === option.value
                              ? "bg-primary text-primary-foreground"
                              : "text-primary hover:bg-primary/10"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTimeSlot(false);
              }}
              className="rounded-lg bg-muted p-1 text-destructive transition hover:bg-destructive/10 hover:text-destructive"
              title="Hủy"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary cursor-pointer hover:bg-primary/20 transition"
            onClick={(e) => {
              e.stopPropagation();
              if (onUpdateTimeSlot) setIsEditingTimeSlot(true);
            }}
            title="Click để sửa khung giờ"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{timeLabel}</span>
            {place.specificTime && (
              <span className="ml-1 text-[10px]">({place.specificTime})</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isEditingCategory ? (
            <div
              className="flex items-center gap-1.5"
              ref={categoryDropdownRef}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingCategory(!isEditingCategory);
                  }}
                  className="flex items-center gap-2 rounded-lg border-2 border-primary/50 bg-card px-3 py-1.5 text-xs text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {(() => {
                    const selected = categoryOptions.find(
                      (opt) => opt.value === place.category
                    );
                    const Icon = selected?.icon || MapPin;
                    return (
                      <>
                        <Icon className="h-3 w-3 text-primary" />
                        <span>{selected?.label || "Tham Quan"}</span>
                        <ChevronDown className="h-3 w-3" />
                      </>
                    );
                  })()}
                </button>
                <AnimatePresence>
                  {isEditingCategory && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border-2 border-primary/50 bg-card shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {categoryOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateCategory?.(option.value);
                              setIsEditingCategory(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition ${
                              place.category === option.value
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-primary/10"
                            }`}
                          >
                            <Icon
                              className={`h-3 w-3 ${
                                place.category === option.value
                                  ? "text-primary-foreground"
                                  : "text-primary"
                              }`}
                            />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingCategory(false);
                }}
                className="rounded-lg bg-muted p-1 text-destructive transition hover:bg-destructive/10 hover:text-destructive"
                title="Hủy"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 cursor-pointer hover:bg-muted50 rounded px-1 py-0.5 transition"
              onClick={(e) => {
                e.stopPropagation();
                if (onUpdateCategory) setIsEditingCategory(true);
              }}
              title="Click để sửa danh mục"
            >
              <CategoryIcon category={place.category} />
            </div>
          )}
          {isEditingCost ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-20 rounded-lg border border-border px-2 py-0.5 text-xs focus:border-primary focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveCost();
                }}
                className="rounded p-0.5 text-green-600 hover:bg-green-50"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                className="rounded p-0.5 text-rose-600 hover:bg-rose-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {place.estimatedCost > 0 ? (
                <span>{place.estimatedCost.toLocaleString("vi-VN")} đ</span>
              ) : (
                <span>Free</span>
              )}
              {onUpdateCost && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingCost(true);
                  }}
                  className="rounded p-0.5 opacity-0 transition hover:bg-muted100 group-hover:opacity-100"
                >
                  <Edit2 className="h-3 w-3 text-muted-foreground400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveName();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancelEditName();
                  }
                }}
                className="flex-1 rounded-lg border border-border px-2 py-1 text-sm font-semibold text-muted-foreground900 focus:border-primary focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveName();
                }}
                className="rounded p-0.5 text-green-600 hover:bg-green-50"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEditName();
                }}
                className="rounded p-0.5 text-rose-600 hover:bg-rose-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground900">
              {place.name}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            {isEditingTime ? (
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onUpdateTime?.(timeValue);
                      setIsEditingTime(false);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setTimeValue(place.specificTime || "");
                      setIsEditingTime(false);
                    }
                  }}
                  onBlur={() => {
                    if (timeValue !== (place.specificTime || "")) {
                      onUpdateTime?.(timeValue);
                    }
                    setIsEditingTime(false);
                  }}
                  className="rounded-lg border border-border bg-card px-2 py-0.5 text-[10px] focus:border-primary focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (timeValue) {
                      onUpdateTime?.(timeValue);
                    }
                    setIsEditingTime(false);
                  }}
                  className="rounded p-0.5 text-green-600 hover:bg-green-50"
                >
                  <Check className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTimeValue(place.specificTime || "");
                    setIsEditingTime(false);
                  }}
                  className="rounded p-0.5 text-rose-600 hover:bg-rose-50"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {place.specificTime ? (
                  <span
                    className="flex items-center gap-1 text-[10px] text-muted-foreground500 cursor-pointer hover:text-primary transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUpdateTime) setIsEditingTime(true);
                    }}
                    title="Click để sửa giờ"
                  >
                    <Clock className="h-3 w-3" />
                    {place.specificTime}
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1 text-[10px] text-muted-foreground400 cursor-pointer hover:text-primary transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUpdateTime) setIsEditingTime(true);
                    }}
                    title="Click để thêm giờ cụ thể"
                  >
                    <Clock className="h-3 w-3" />
                    Thêm giờ
                  </span>
                )}
                {place.latitude && place.longitude && (
                  <>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground400">
                      <MapPin className="h-3 w-3" />
                      Đã đặt vị trí
                    </span>
                    {onShowNearbyPlaces && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowNearbyPlaces();
                        }}
                        className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                        title="Xem địa điểm xung quanh"
                      >
                        <Navigation className="h-3 w-3" />
                        Xung quanh
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onUpdateName && !isEditingName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              className="rounded-full bg-muted50 px-2 py-1 text-xs text-muted-foreground500 opacity-0 transition group-hover:opacity-100 hover:bg-muted100"
              title="Sửa tên địa điểm"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          )}
          {onRemoveLocation && place.latitude && place.longitude && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveLocation();
              }}
              className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-600 opacity-0 transition group-hover:opacity-100 hover:bg-amber-100"
              title="Xóa vị trí trên bản đồ"
            >
              <MapPinOff className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="rounded-full bg-muted100 px-2 py-1 text-xs text-muted-foreground500 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
