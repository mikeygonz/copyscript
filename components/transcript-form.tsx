"use client";

import React, {
  useState,
  useActionState,
  useEffect,
  startTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTranscript } from "@/app/actions";
import { cn } from "@/lib/utils";
import {
  Copy,
  Check,
  Clock,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Image from "next/image";

type RecentSearch = {
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelName?: string;
  channelUrl?: string;
};

type TranscriptFormProps = {
  titleElement?: React.ReactNode;
};

export const TranscriptForm = ({ titleElement }: TranscriptFormProps) => {
  const [state, formAction, isPending] = useActionState(getTranscript, null);
  const [cachedState, setCachedState] = useState<{
    transcript: any[];
    metadata: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState<string>("");
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [focusedRecentIndex, setFocusedRecentIndex] = useState<number | null>(
    null
  );
  const mainInputRef = React.useRef<HTMLInputElement>(null);
  const recentSearchRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const errorId = "url-error";
  const hasError = !!(validationError || state?.error);
  const errorMessage = validationError || state?.error;

  // Use cached state if available, otherwise use action state
  const displayState = cachedState || state;
  const showHeader = !!(isPending || displayState?.transcript);
  const showBorder = !!displayState?.transcript; // Only show border when transcript is displayed

  const handleLogoClick = () => {
    setSelectedVideoId(null);
    setCachedState(null);
    setLastSubmittedUrl("");
    setCurrentUrl("");
    setValidationError(null);
    // Clear the input field
    const input = document.querySelector(
      'input[name="url"]'
    ) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks on non-interactive elements
    const target = e.target as HTMLElement;
    const isInteractive =
      target.tagName === "BUTTON" ||
      target.tagName === "A" ||
      target.tagName === "INPUT" ||
      target.tagName === "SVG" ||
      target.closest("button") ||
      target.closest("a") ||
      target.closest("form") ||
      target.closest("svg");

    if (!isInteractive && mainInputRef.current && !showHeader) {
      // Toggle focus: if focused, blur; if not focused, focus
      if (isInputFocused) {
        mainInputRef.current.blur();
      } else {
        mainInputRef.current.focus();
      }
    } else if (isInteractive && mainInputRef.current && !showHeader) {
      // If clicking on interactive element, blur input
      if (isInputFocused && target.tagName !== "INPUT") {
        mainInputRef.current.blur();
      }
    }
  };

  const handleCopy = async () => {
    if (displayState?.transcript) {
      // Detect unit format once based on first item (consistent with backend)
      const firstItem = displayState.transcript[0];
      const sampleOffset = firstItem?.offset ?? 0;
      const likelyMilliseconds = sampleOffset > 1000;

      const textToCopy = showTimestamps
        ? displayState.transcript
            .map((item) => {
              const offsetValue =
                typeof item.offset === "number" && !isNaN(item.offset)
                  ? item.offset
                  : 0;

              // Use consistent detection based on first item
              const seconds = likelyMilliseconds
                ? offsetValue / 1000
                : offsetValue;
              const timestamp = formatTimestamp(seconds);
              return `[${timestamp}] ${item.text}`;
            })
            .join("\n")
        : displayState.transcript.map((item) => item.text).join("\n");
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  function normalizeUrl(url: string): string {
    let normalizedUrl = url.trim();
    // Handle URLs without protocol (common on mobile)
    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    return normalizedUrl;
  }

  function extractVideoId(url: string): string | null {
    try {
      // Normalize URL - handle URLs without protocol
      const normalizedUrl = normalizeUrl(url);

      const urlObj = new URL(normalizedUrl);
      if (urlObj.hostname.includes("youtube.com")) {
        let videoId = urlObj.searchParams.get("v");

        // Also check for video ID in path for mobile URLs like /watch/v/VIDEO_ID
        if (!videoId && urlObj.pathname.includes("/watch/")) {
          const pathParts = urlObj.pathname.split("/");
          const watchIndex = pathParts.indexOf("watch");
          if (watchIndex >= 0 && pathParts[watchIndex + 1]) {
            videoId = pathParts[watchIndex + 1];
          }
        }

        return videoId ? videoId.trim() : null;
      } else if (urlObj.hostname.includes("youtu.be")) {
        // Handle youtu.be URLs - extract video ID from pathname, removing any query params
        const pathname = urlObj.pathname.slice(1); // Remove leading slash
        // Split by '/' or '?' to get just the video ID (in case there are extra path segments or query params)
        const videoId = pathname.split("/")[0].split("?")[0];
        return videoId ? videoId.trim() : null;
      }
      return null;
    } catch (error) {
      console.log("[v0] Client-side extractVideoId error:", error);
      return null;
    }
  }

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recentSearches");
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Auto-focus input on page load
  useEffect(() => {
    if (mainInputRef.current && !showHeader) {
      mainInputRef.current.focus();
    }
  }, [showHeader]);

  // Handle Enter key to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only focus input on Enter if not already in an input/textarea or form
      if (e.key === "Enter" && !showHeader) {
        const target = e.target as HTMLElement;
        const isInInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.closest("form")?.querySelector("input:focus") ||
          target.closest("form")?.querySelector("textarea:focus");

        if (
          !isInInput &&
          mainInputRef.current &&
          document.activeElement !== mainInputRef.current
        ) {
          e.preventDefault();
          mainInputRef.current.focus();
          mainInputRef.current.select();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showHeader]);

  // Handle clicks outside input to blur it
  useEffect(() => {
    if (!showHeader && mainInputRef.current) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          mainInputRef.current &&
          !mainInputRef.current.contains(target) &&
          isInputFocused
        ) {
          // Don't blur if clicking on interactive elements that might want focus
          const isInteractive =
            target.tagName === "BUTTON" ||
            target.tagName === "A" ||
            target.tagName === "INPUT" ||
            target.closest("button") ||
            target.closest("a") ||
            target.closest("form");

          if (!isInteractive) {
            mainInputRef.current.blur();
          }
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showHeader, isInputFocused]);

  // Save to recent searches when a new transcript is fetched
  useEffect(() => {
    if (
      state?.metadata &&
      state?.transcript &&
      lastSubmittedUrl &&
      typeof window !== "undefined"
    ) {
      const videoId = extractVideoId(lastSubmittedUrl);
      if (!videoId) {
        console.error(
          "[v0] Could not extract video ID from URL:",
          lastSubmittedUrl
        );
        return;
      }

      console.log(
        "[v0] Saving transcript to history - Video ID:",
        videoId,
        "Title:",
        state.metadata.title,
        "URL:",
        lastSubmittedUrl,
        "Current loadingVideoId:",
        loadingVideoId
      );

      // Clear cached state when new transcript is fetched
      setCachedState(null);

      const searchEntry: RecentSearch = {
        videoId,
        url: lastSubmittedUrl,
        title: state.metadata.title,
        thumbnail: state.metadata.thumbnail,
        duration: state.metadata.duration,
        channelName: state.metadata.channelName,
        channelUrl: state.metadata.channelUrl,
      };

      setSelectedVideoId(videoId);
      setCurrentUrl(lastSubmittedUrl); // Sync currentUrl with the URL we just fetched

      // Only add to recent searches if it's not already there
      // Don't reorder - keep original position
      setRecentSearches((prev) => {
        // Remove any existing entries with the same videoId first to prevent duplicates
        const withoutDuplicates = prev.filter(
          (s) => s.videoId !== searchEntry.videoId
        );

        // Add the new entry at the beginning
        const updated = [searchEntry, ...withoutDuplicates].slice(0, 10);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
        console.log("[v0] Added new item to history:", searchEntry);

        // Clear loading state after this update completes
        // Check if the new item is now in the list
        if (updated.some((s) => s.videoId === videoId)) {
          // Use setTimeout to ensure this happens after React has processed the state update
          setTimeout(() => {
            console.log("[v0] Clearing loadingVideoId after history update");
            setLoadingVideoId(null);
          }, 0);
        }

        return updated;
      });

      // Cache transcript data
      localStorage.setItem(
        `transcriptCache_${videoId}`,
        JSON.stringify({
          transcript: state.transcript,
          metadata: state.metadata,
        })
      );
    }
  }, [state?.metadata, state?.transcript, lastSubmittedUrl]);

  const handleRecentSearchClick = (
    url: string,
    e?: React.MouseEvent | React.KeyboardEvent
  ) => {
    // Prevent click if clicking on delete button or dropdown menu
    if (e && (e.target as HTMLElement).closest("[data-delete-button]")) {
      return;
    }
    if (e && (e.target as HTMLElement).closest("[role='menu']")) {
      return;
    }
    if (
      e &&
      (e.target as HTMLElement).closest("button[aria-haspopup='menu']")
    ) {
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) return;

    console.log("[v0] Clicking history item - Video ID:", videoId, "URL:", url);

    // Check if we have cached transcript data FIRST, before clearing anything
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`transcriptCache_${videoId}`);
      console.log(
        "[v0] Cache lookup for videoId:",
        videoId,
        "Found:",
        !!cached
      );

      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          console.log(
            "[v0] Loading cached transcript for:",
            videoId,
            "Title:",
            cachedData.metadata?.title
          );

          const input = document.querySelector(
            'input[name="url"]'
          ) as HTMLInputElement;
          if (input) {
            input.value = url;
            setCurrentUrl(url);
          }

          // Load cached data instantly - no skeleton, no delay, no clearing state
          setCachedState({
            transcript: cachedData.transcript,
            metadata: cachedData.metadata,
          });
          setSelectedVideoId(videoId);
          setLastSubmittedUrl(""); // Clear submitted URL to prevent interference
          // Don't set loadingVideoId for cached items - instant load
          return;
        } catch (e) {
          // If cache parsing fails, fall through to normal fetch
          console.error("[v0] Error parsing cached transcript:", e);
        }
      } else {
        console.log("[v0] No cached transcript found for:", videoId);
      }
    }

    // No cache found - only then clear state and set loading
    setLoadingVideoId(videoId); // Track which video is loading
    setCachedState(null); // Only clear if we're actually fetching
    setLastSubmittedUrl(url); // Set this so the useEffect knows which URL we're fetching
    const input = document.querySelector(
      'input[name="url"]'
    ) as HTMLInputElement;
    if (input) {
      input.value = url;
      setCurrentUrl(url);
      // Submit the form
      const form = input.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleCopyTranscript = async (videoId: string) => {
    if (typeof window === "undefined") return;

    const cached = localStorage.getItem(`transcriptCache_${videoId}`);
    if (!cached) return;

    try {
      const cachedData = JSON.parse(cached);
      const transcript = cachedData.transcript;

      if (transcript) {
        // Detect unit format
        const firstItem = transcript[0];
        const sampleOffset = firstItem?.offset ?? 0;
        const likelyMilliseconds = sampleOffset > 1000;

        const textToCopy = transcript
          .map((item: any) => {
            const offsetValue =
              typeof item.offset === "number" && !isNaN(item.offset)
                ? item.offset
                : 0;
            const seconds = likelyMilliseconds
              ? offsetValue / 1000
              : offsetValue;
            const timestamp = formatTimestamp(seconds);
            return `[${timestamp}] ${item.text}`;
          })
          .join("\n");

        await navigator.clipboard.writeText(textToCopy);
        setCopiedTranscript(videoId);
        setTimeout(() => setCopiedTranscript(null), 2000);
      }
    } catch (e) {
      console.error("Error copying transcript:", e);
    }
  };

  const handleRecentSearchKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    url: string,
    index: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRecentSearchClick(url, e);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index + 1;
      if (
        nextIndex < recentSearches.length &&
        recentSearchRefs.current[nextIndex]
      ) {
        recentSearchRefs.current[nextIndex]?.focus();
        setFocusedRecentIndex(nextIndex);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index - 1;
      if (prevIndex >= 0 && recentSearchRefs.current[prevIndex]) {
        recentSearchRefs.current[prevIndex]?.focus();
        setFocusedRecentIndex(prevIndex);
      } else if (prevIndex < 0 && mainInputRef.current) {
        mainInputRef.current.focus();
        setFocusedRecentIndex(null);
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      if (recentSearchRefs.current[0]) {
        recentSearchRefs.current[0]?.focus();
        setFocusedRecentIndex(0);
      }
    } else if (e.key === "End") {
      e.preventDefault();
      const lastIndex = recentSearches.length - 1;
      if (recentSearchRefs.current[lastIndex]) {
        recentSearchRefs.current[lastIndex]?.focus();
        setFocusedRecentIndex(lastIndex);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      mainInputRef.current?.focus();
      setFocusedRecentIndex(null);
    }
  };

  const handleDeleteClick = (
    videoId: string,
    e?: React.MouseEvent | React.KeyboardEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.videoId !== videoId);
      localStorage.setItem("recentSearches", JSON.stringify(filtered));

      // Also delete cached transcript
      if (typeof window !== "undefined") {
        localStorage.removeItem(`transcriptCache_${videoId}`);
      }

      // If this was the last item, clear the transcript display
      if (filtered.length === 0) {
        setSelectedVideoId(null);
        setCachedState(null);
        setLastSubmittedUrl("");
        setCurrentUrl("");
        // Clear the input field
        const input = document.querySelector(
          'input[name="url"]'
        ) as HTMLInputElement;
        if (input) {
          input.value = "";
        }
      }

      return filtered;
    });

    // Clear selected if deleting current item
    if (selectedVideoId === videoId) {
      setSelectedVideoId(null);
      setCachedState(null);
      setLastSubmittedUrl("");
      setCurrentUrl("");
    }
  };

  const handleNewSearch = () => {
    const input = document.querySelector(
      'input[name="url"]'
    ) as HTMLInputElement;
    if (input) {
      input.value = "";
      input.focus();
      setCurrentUrl("");
    }
  };

  const validateUrl = (url: string): string | null => {
    if (!url || url.trim() === "") {
      return "Please enter a valid YouTube URL";
    }
    try {
      // Normalize URL - handle URLs without protocol (common on mobile)
      const normalizedUrl = normalizeUrl(url);

      const urlObj = new URL(normalizedUrl);
      if (
        !urlObj.hostname.includes("youtube.com") &&
        !urlObj.hostname.includes("youtu.be")
      ) {
        return "Please enter a valid YouTube URL";
      }
      const videoId = extractVideoId(normalizedUrl);
      if (!videoId) {
        return "Please enter a valid YouTube URL";
      }
      return null;
    } catch (error) {
      console.log("[v0] Client-side URL validation error:", error);
      return "Please enter a valid YouTube URL";
    }
  };

  return (
    <div
      className="space-y-4 sm:space-y-6"
      onClick={!showHeader ? handleHomeClick : undefined}
    >
      {/* Logo - Fixed top left in home view */}
      {!showHeader && (
        <div className="fixed top-[38px] left-[40px] z-50 pointer-events-none">
          <div
            className="select-none cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto flex items-center gap-[8px]"
            onClick={handleLogoClick}
          >
            <div className="relative shrink-0 size-[28px]">
              <div className="absolute inset-[10.71%_14.29%]">
                <div className="absolute inset-[-4.55%_-5%]">
                  <img
                    src="/logomark.svg"
                    alt="Copyscript logomark"
                    className="block max-w-none size-full"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center shrink-0">
              <span className="text-[20px] leading-normal text-white font-sarpanch whitespace-nowrap not-italic">
                copyscript
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Show title only when not in header mode */}
      {!showHeader && titleElement}

      {/* Persistent Header - Shows when transcript is loading or loaded */}
      {showHeader && (
        <div
          className={cn(
            "fixed top-0 left-0 right-0 bg-background z-50 px-3 sm:px-4",
            showBorder && "border-b border-border"
          )}
        >
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 py-3 sm:py-0 sm:h-[65px]">
            {/* Logo - Left */}
            <div
              className="select-none cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 flex items-center gap-[8px]"
              onClick={handleLogoClick}
            >
              <div className="relative shrink-0 size-6 sm:size-7">
                <div className="absolute inset-[10.71%_14.29%]">
                  <div className="absolute inset-[-4.55%_-5%]">
                    <img
                      src="/logomark.svg"
                      alt="Copyscript logomark"
                      className="block max-w-none size-full"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center shrink-0">
                <span className="text-base sm:text-lg text-white font-sarpanch leading-normal whitespace-nowrap not-italic">
                  copyscript
                </span>
              </div>
            </div>

            {/* Search Form - Centered */}
            <div className="flex-1 flex justify-center min-w-0 w-full sm:w-auto">
              <form
                action={formAction}
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  let url = formData.get("url") as string;

                  // Normalize URL before validation and submission
                  url = normalizeUrl(url);
                  formData.set("url", url);

                  // Validate URL
                  const error = validateUrl(url);
                  if (error) {
                    setValidationError(error);
                    return;
                  }

                  setValidationError(null);
                  const videoId = extractVideoId(url);
                  setCurrentUrl(url);
                  setLastSubmittedUrl(url);
                  setLoadingVideoId(videoId || null);
                  setSelectedVideoId(null);
                  setCachedState(null);
                  if (videoId) {
                    setRecentSearches((prev) => {
                      const filtered = prev.filter(
                        (s) => s.videoId !== videoId
                      );
                      if (filtered.length !== prev.length) {
                        localStorage.setItem(
                          "recentSearches",
                          JSON.stringify(filtered)
                        );
                        if (typeof window !== "undefined") {
                          localStorage.removeItem(`transcriptCache_${videoId}`);
                        }
                      }
                      return filtered;
                    });
                  }
                  console.log("[v0] Form submitted with URL:", url);

                  startTransition(() => {
                    formAction(formData);
                  });
                }}
                className="w-full max-w-[800px]"
              >
                <div className="flex flex-col sm:flex-row gap-[8px] items-stretch sm:items-center">
                  <Input
                    type="url"
                    name="url"
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={isPending}
                    className={cn(
                      "flex-1 text-sm sm:text-base min-w-0",
                      (validationError || state?.error) && "aria-invalid"
                    )}
                    aria-invalid={!!(validationError || state?.error)}
                    aria-label="YouTube video URL"
                    aria-describedby={
                      validationError || state?.error
                        ? `${errorId}-header`
                        : undefined
                    }
                    autoComplete="url"
                    onChange={(e) => {
                      setCurrentUrl(e.target.value);
                      if (validationError) {
                        setValidationError(null);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="text-xs sm:text-sm w-full sm:w-auto"
                    aria-label={
                      isPending ? "Fetching transcript" : "Get transcript"
                    }
                  >
                    {isPending ? "Fetching..." : "Get Transcript"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Controls - Right (empty for now) */}
            <div className="hidden sm:block w-[120px]" />
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      {showHeader && <div className="h-[100px] sm:h-[65px]" />}

      {/* Main search form - hidden when transcript is showing */}
      {!showHeader && (
        <form
          action={formAction}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            let url = formData.get("url") as string;

            // Normalize URL before validation and submission
            url = normalizeUrl(url);
            formData.set("url", url);

            // Validate URL
            const error = validateUrl(url);
            if (error) {
              setValidationError(error);
              return;
            }

            setValidationError(null);
            const videoId = extractVideoId(url);
            setCurrentUrl(url);
            setLastSubmittedUrl(url); // Track the URL we just submitted
            setLoadingVideoId(videoId || null); // Track which video is loading
            setSelectedVideoId(null); // Clear selected state when loading new video
            setCachedState(null); // Clear cached state
            // Clear any existing history entry for this video to prevent showing old metadata
            if (videoId) {
              setRecentSearches((prev) => {
                const filtered = prev.filter((s) => s.videoId !== videoId);
                if (filtered.length !== prev.length) {
                  localStorage.setItem(
                    "recentSearches",
                    JSON.stringify(filtered)
                  );
                  // Also clear cached transcript to prevent stale data
                  if (typeof window !== "undefined") {
                    localStorage.removeItem(`transcriptCache_${videoId}`);
                  }
                }
                return filtered;
              });
            }
            console.log("[v0] Form submitted with URL:", url);

            // Submit the form within a transition
            startTransition(() => {
              formAction(formData);
            });
          }}
        >
          <div className="space-y-1 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-[8px] items-center justify-center">
              <Input
                ref={mainInputRef}
                type="url"
                name="url"
                placeholder="https://youtube.com/watch?v=..."
                disabled={isPending}
                className={cn(
                  "text-base sm:text-base w-full sm:w-[434px]",
                  hasError && "aria-invalid"
                )}
                aria-invalid={hasError}
                aria-describedby={hasError ? errorId : undefined}
                aria-errormessage={hasError ? errorId : undefined}
                aria-label="YouTube video URL"
                autoComplete="url"
                onFocus={() => {
                  setIsInputFocused(true);
                  setFocusedRecentIndex(null);
                }}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={(e) => {
                  // Arrow down to move to first recent item
                  if (
                    e.key === "ArrowDown" &&
                    recentSearches.length > 0 &&
                    !showHeader
                  ) {
                    e.preventDefault();
                    if (recentSearchRefs.current[0]) {
                      recentSearchRefs.current[0]?.focus();
                      setFocusedRecentIndex(0);
                    }
                  }
                }}
                onChange={(e) => {
                  setCurrentUrl(e.target.value);
                  // Clear validation error when user starts typing
                  if (validationError) {
                    setValidationError(null);
                  }
                  // Note: Server errors (state.error) will persist until next submission
                }}
              />
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-[160px]"
                aria-label={
                  isPending ? "Fetching transcript" : "Get transcript"
                }
              >
                {isPending ? "Fetching..." : "Get Transcript"}
              </Button>
            </div>
            {hasError && (
              <div className="flex flex-col sm:flex-row gap-[8px] justify-center items-center">
                <div className="w-full sm:w-[434px]">
                  <p
                    id={errorId}
                    role="alert"
                    aria-live="polite"
                    className="text-sm text-destructive/80 pl-[12px] text-left"
                  >
                    {errorMessage}
                  </p>
                </div>
                <div className="hidden sm:block w-auto sm:w-[160px]" />{" "}
                {/* Spacer to balance the button width */}
              </div>
            )}
          </div>
        </form>
      )}

      {recentSearches.length > 0 && !displayState?.transcript && !isPending && (
        <div className="space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-2">
            Recents
          </h2>
          <div className="space-y-1.5" role="list" aria-label="Recent searches">
            {recentSearches.map((search, index) => {
              const isSelected = selectedVideoId === search.videoId;
              return (
                <div
                  key={search.videoId}
                  className="relative group"
                  role="listitem"
                >
                  <button
                    ref={(el) => {
                      recentSearchRefs.current[index] = el;
                    }}
                    onClick={(e) => handleRecentSearchClick(search.url, e)}
                    onKeyDown={(e) =>
                      handleRecentSearchKeyDown(e, search.url, index)
                    }
                    aria-label={`Load transcript for ${search.title}${
                      search.channelName ? ` by ${search.channelName}` : ""
                    }`}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-2 sm:p-1.5 rounded-md transition-colors border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] sm:min-h-auto ${
                      isSelected
                        ? "bg-accent text-foreground border-border"
                        : "border-transparent text-foreground/90 hover:bg-accent/30 hover:text-foreground focus:bg-accent/30 active:bg-accent/50"
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="relative w-16 h-14 shrink-0 flex-shrink-0">
                        <Image
                          src={search.thumbnail}
                          alt={search.title}
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-medium line-clamp-2 leading-tight text-foreground flex-1 min-w-0">
                            {search.title}
                          </p>
                          <div className="w-7 shrink-0" />
                        </div>
                        <div className="flex flex-col gap-1">
                          {search.channelName && (
                            <span className="text-xs text-muted-foreground/70">
                              {search.channelName}
                            </span>
                          )}
                          {search.duration && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-muted-foreground/70" />
                              <span className="text-xs text-muted-foreground/80 leading-none">
                                {search.duration}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`More options for ${search.title}`}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-accent/50 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <MoreVertical
                          className="h-3.5 w-3.5 text-muted-foreground/60"
                          aria-hidden="true"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTranscript(search.videoId);
                        }}
                        className="cursor-pointer"
                        aria-label={
                          copiedTranscript === search.videoId
                            ? "Transcript copied"
                            : "Copy transcript"
                        }
                      >
                        {copiedTranscript === search.videoId ? (
                          <>
                            <Check
                              className="h-4 w-4 mr-2"
                              aria-hidden="true"
                            />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                            Copy Transcript
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(search.url);
                        }}
                        className="cursor-pointer"
                        aria-label={
                          copiedUrl === search.url ? "URL copied" : "Copy URL"
                        }
                      >
                        {copiedUrl === search.url ? (
                          <>
                            <Check
                              className="h-4 w-4 mr-2"
                              aria-hidden="true"
                            />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                            Copy URL
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(search.videoId, e);
                        }}
                        className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                        aria-label={`Delete ${search.title}`}
                      >
                        <Trash2
                          className="h-4 w-4 mr-2 text-red-500"
                          aria-hidden="true"
                        />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(isPending ||
        (displayState?.transcript &&
          (recentSearches.length > 0 || selectedVideoId !== null))) && (
        <div className="w-screen -mx-[calc((100vw-100%)/2)] px-2 sm:px-4 pb-1">
          <div className="max-w-[943px] mx-auto">
            {/* Video Metadata Header */}
            {displayState?.metadata && (
              <div className="mb-3 sm:mb-4 px-2 space-y-2">
                {lastSubmittedUrl ? (
                  <a
                    href={lastSubmittedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h2 className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors break-words">
                      {displayState.metadata.title}
                    </h2>
                  </a>
                ) : (
                  <h2 className="text-base sm:text-lg font-semibold text-foreground break-words">
                    {displayState.metadata.title}
                  </h2>
                )}
                <div className="flex items-center gap-3 text-sm">
                  {displayState.metadata.thumbnail && lastSubmittedUrl ? (
                    <a
                      href={lastSubmittedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-12 h-9 shrink-0 block"
                    >
                      <Image
                        src={displayState.metadata.thumbnail}
                        alt="Video thumbnail"
                        fill
                        className="object-cover rounded"
                        unoptimized
                      />
                    </a>
                  ) : displayState.metadata.thumbnail ? (
                    <div className="relative w-12 h-9 shrink-0">
                      <Image
                        src={displayState.metadata.thumbnail}
                        alt="Video thumbnail"
                        fill
                        className="object-cover rounded"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
                    {displayState.metadata.channelName && (
                      <>
                        {displayState.metadata.channelUrl ? (
                          <a
                            href={displayState.metadata.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {displayState.metadata.channelName}
                          </a>
                        ) : (
                          <span>{displayState.metadata.channelName}</span>
                        )}
                      </>
                    )}
                    {displayState.metadata.duration && (
                      <>
                        <span>?</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{displayState.metadata.duration}</span>
                        </div>
                      </>
                    )}
                    {lastSubmittedUrl && (
                      <>
                        <span>?</span>
                        <a
                          href={lastSubmittedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Watch on YouTube
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Transcript Content */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-2">
                    Transcript
                  </h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center border border-border rounded-md p-0.5 bg-input shadow-sm flex-1 min-w-0">
                      <button
                        onClick={() => setShowTimestamps(true)}
                        disabled={isPending}
                        aria-pressed={showTimestamps}
                        aria-label="Show timestamps"
                        className={`h-8 sm:h-7 px-2 sm:px-3 text-xs rounded-sm transition-colors flex-1 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] sm:min-h-auto ${
                          showTimestamps
                            ? "bg-background text-foreground"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Timestamps
                      </button>
                      <button
                        onClick={() => setShowTimestamps(false)}
                        disabled={isPending}
                        aria-pressed={!showTimestamps}
                        aria-label="Hide timestamps"
                        className={`h-8 sm:h-7 px-2 sm:px-3 text-xs rounded-sm transition-colors flex-1 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] sm:min-h-auto ${
                          !showTimestamps
                            ? "bg-background text-foreground"
                            : "bg-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        No timestamps
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      disabled={isPending || !displayState?.transcript}
                      className="gap-2 text-xs whitespace-nowrap flex-shrink-0 w-full sm:w-auto min-h-[44px] sm:min-h-auto"
                      aria-label={
                        copied ? "Transcript copied" : "Copy transcript"
                      }
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" aria-hidden="true" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-md shadow-layered">
                  <div className="p-3 sm:p-4">
                    {isPending ? (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-sm text-muted-foreground">
                          Loading...
                        </p>
                      </div>
                    ) : displayState?.transcript ? (
                      showTimestamps ? (
                        <div className="space-y-2 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                          {(() => {
                            // Detect unit format once based on first item (consistent with backend)
                            const firstItem = displayState.transcript[0];
                            const sampleOffset = firstItem?.offset ?? 0;
                            const likelyMilliseconds = sampleOffset > 1000;

                            return displayState.transcript.map(
                              (item, index) => {
                                const offsetValue =
                                  typeof item.offset === "number" &&
                                  !isNaN(item.offset)
                                    ? item.offset
                                    : 0;

                                // Use consistent detection based on first item
                                const seconds = likelyMilliseconds
                                  ? offsetValue / 1000
                                  : offsetValue;

                                const timestamp = formatTimestamp(seconds);
                                const timestampSeconds = Math.floor(seconds);
                                const videoUrl = lastSubmittedUrl
                                  ? `${lastSubmittedUrl}&t=${timestampSeconds}s`
                                  : null;

                                return (
                                  <div
                                    key={index}
                                    className="flex gap-3 items-baseline"
                                  >
                                    {videoUrl ? (
                                      <a
                                        href={videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary text-xs font-mono shrink-0 tabular-nums transition-colors cursor-pointer"
                                      >
                                        {timestamp}
                                      </a>
                                    ) : (
                                      <span className="text-muted-foreground text-xs font-mono shrink-0 tabular-nums">
                                        {timestamp}
                                      </span>
                                    )}
                                    <span className="text-sm font-mono leading-relaxed flex-1">
                                      {item.text}
                                    </span>
                                  </div>
                                );
                              }
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                          <pre className="text-sm font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                            {displayState.transcript
                              .map((item) => item.text)
                              .join(" ")}
                          </pre>
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Video Recents Sidebar - Show when there are recent searches OR when loading */}
              {(recentSearches.length > 0 || isPending) && (
                <div className="w-full lg:w-64 shrink-0 space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-2">
                    Recents
                  </h3>
                  <div
                    className="space-y-1.5"
                    role="list"
                    aria-label="Recent searches"
                  >
                    {loadingVideoId && recentSearches.length === 0 ? (
                      // Show skeleton placeholder when loading with no prior history
                      <div
                        className="p-1.5 rounded-md animate-pulse"
                        role="status"
                        aria-label="Loading"
                      >
                        <div className="flex gap-3">
                          <div className="relative w-16 h-10 shrink-0 bg-muted rounded"></div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="flex items-center gap-1.5">
                              <div className="h-3 w-3 bg-muted rounded"></div>
                              <div className="h-3 bg-muted rounded w-16"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {loadingVideoId && recentSearches.length > 0 ? (
                      // Show skeleton placeholder for the currently loading item at the top
                      // This skeleton has no metadata - it's just a placeholder
                      <div
                        className="p-1.5 rounded-md animate-pulse"
                        role="status"
                        aria-label="Loading"
                      >
                        <div className="flex gap-3">
                          <div className="relative w-16 h-10 shrink-0 bg-muted rounded"></div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="flex items-center gap-1.5">
                              <div className="h-3 w-3 bg-muted rounded"></div>
                              <div className="h-3 bg-muted rounded w-16"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {recentSearches
                      .filter((search) => {
                        // Always filter out the loading video ID to prevent duplicates
                        // This ensures old metadata doesn't show while loading
                        if (
                          loadingVideoId &&
                          search.videoId === loadingVideoId
                        ) {
                          console.log(
                            "[v0] Filtering out loading video from history display:",
                            search.videoId,
                            "to prevent showing old metadata"
                          );
                          return false;
                        }
                        return true;
                      })
                      .map((search, index) => {
                        const isSelected = selectedVideoId === search.videoId;
                        // Adjust index for filtered array
                        const displayIndex = recentSearches.findIndex(
                          (s) => s.videoId === search.videoId
                        );
                        return (
                          <div
                            key={search.videoId}
                            className="relative group"
                            role="listitem"
                          >
                            <button
                              ref={(el) => {
                                recentSearchRefs.current[displayIndex] = el;
                              }}
                              onClick={(e) =>
                                handleRecentSearchClick(search.url, e)
                              }
                              onKeyDown={(e) =>
                                handleRecentSearchKeyDown(
                                  e,
                                  search.url,
                                  displayIndex
                                )
                              }
                              aria-label={`Load transcript for ${search.title}${
                                search.channelName
                                  ? ` by ${search.channelName}`
                                  : ""
                              }`}
                              aria-pressed={isSelected}
                              className={`w-full text-left p-2 sm:p-1.5 rounded-md transition-colors border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] sm:min-h-auto ${
                                isSelected
                                  ? "bg-accent text-foreground border-border"
                                  : "border-transparent text-foreground/90 hover:bg-accent/30 hover:text-foreground focus:bg-accent/30 active:bg-accent/50"
                              }`}
                            >
                              <div className="flex gap-3 items-start">
                                <div className="relative w-16 h-14 shrink-0 flex-shrink-0">
                                  <Image
                                    src={search.thumbnail}
                                    alt={search.title}
                                    fill
                                    className="object-cover rounded"
                                    unoptimized
                                  />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-1">
                                  <div className="flex items-start gap-2">
                                    <p className="text-sm font-medium line-clamp-2 leading-tight text-foreground flex-1 min-w-0">
                                      {search.title}
                                    </p>
                                    <div className="w-7 shrink-0" />
                                  </div>
                                  {search.channelName && (
                                    <div>
                                      <span className="text-xs text-muted-foreground/70">
                                        {search.channelName}
                                      </span>
                                    </div>
                                  )}
                                  {search.duration && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-muted-foreground/70" />
                                      <span className="text-xs text-muted-foreground/80 leading-none">
                                        {search.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label={`More options for ${search.title}`}
                                  className="absolute top-2 right-2 p-1 rounded hover:bg-accent/50 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                  <MoreVertical
                                    className="h-3.5 w-3.5 text-muted-foreground/60"
                                    aria-hidden="true"
                                  />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyTranscript(search.videoId);
                                  }}
                                  className="cursor-pointer"
                                  aria-label={
                                    copiedTranscript === search.videoId
                                      ? "Transcript copied"
                                      : "Copy transcript"
                                  }
                                >
                                  {copiedTranscript === search.videoId ? (
                                    <>
                                      <Check
                                        className="h-4 w-4 mr-2"
                                        aria-hidden="true"
                                      />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy
                                        className="h-4 w-4 mr-2"
                                        aria-hidden="true"
                                      />
                                      Copy Transcript
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyUrl(search.url);
                                  }}
                                  className="cursor-pointer"
                                  aria-label={
                                    copiedUrl === search.url
                                      ? "URL copied"
                                      : "Copy URL"
                                  }
                                >
                                  {copiedUrl === search.url ? (
                                    <>
                                      <Check
                                        className="h-4 w-4 mr-2"
                                        aria-hidden="true"
                                      />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy
                                        className="h-4 w-4 mr-2"
                                        aria-hidden="true"
                                      />
                                      Copy URL
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(search.videoId, e);
                                  }}
                                  className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                  aria-label={`Delete ${search.title}`}
                                >
                                  <Trash2
                                    className="h-4 w-4 mr-2 text-red-500"
                                    aria-hidden="true"
                                  />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
