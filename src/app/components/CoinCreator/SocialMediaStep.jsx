"use client";

import React, { useState } from "react";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Youtube,
  Users,
  Zap,
  Link2,
  Sparkles,
  CheckCircle,
  Globe,
  Loader2,
  AlertTriangle,
  Play,
  MessageSquare,
  ThumbsUp,
  Eye,
  Clock,
  Calendar,
  Hash,
  Video,
  Music,
  Camera,
  MessageCircle,
  Smartphone,
} from "lucide-react";
import {
  fetchSocialMediaData,
  generateTokenFromSocialData,
  SUPPORTED_PLATFORMS,
} from "../../services/socialMediaParser";

// Platform icons with working status
const platformIcons = {
  youtube: Youtube,
  reddit: Users,
  twitter: Zap,
  tiktok: Music,
  instagram: Camera,
  farcaster: MessageCircle,
};

// Platform status colors
const platformStatus = {
  youtube: { working: true, color: "red" },
  reddit: { working: true, color: "orange" },
  twitter: { working: true, color: "blue" },
  tiktok: { working: true, color: "pink" },
  instagram: { working: true, color: "purple" },
  farcaster: { working: true, color: "indigo" },
};

// Enhanced Status Component
const StatusIndicator = ({ status, message, className = "" }) => {
  const statusConfig = {
    idle: {
      icon: Link2,
      colors:
        "text-slate-500 bg-slate-100/60 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-600/50",
      pulse: false,
    },
    parsing: {
      icon: Loader2,
      colors:
        "text-indigo-600 bg-indigo-100/80 dark:bg-indigo-900/50 border-indigo-200/60 dark:border-indigo-600/50",
      pulse: true,
    },
    success: {
      icon: CheckCircle,
      colors:
        "text-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/50 border-emerald-200/60 dark:border-emerald-600/50",
      pulse: false,
    },
    error: {
      icon: AlertTriangle,
      colors:
        "text-red-600 bg-red-100/80 dark:bg-red-900/50 border-red-200/60 dark:border-red-600/50",
      pulse: false,
    },
  };

  const config = statusConfig[status] || statusConfig.idle;
  const IconComponent = config.icon;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${config.colors} ${className}`}
    >
      <div className="relative">
        <IconComponent
          className={`w-5 h-5 ${config.pulse ? "animate-spin" : ""}`}
        />
        {config.pulse && (
          <div className="absolute inset-0 w-5 h-5 rounded-full animate-ping opacity-20 bg-current"></div>
        )}
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium leading-tight">{message}</span>
      </div>
    </div>
  );
};

const SocialMediaStep = ({
  formData,
  setFormData,
  isLoading,
  goToNextStep,
  goToPreviousStep,
  theme,
}) => {
  const [socialUrl, setSocialUrl] = useState("");
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [socialData, setSocialData] = useState(null);
  const [error, setError] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [parseStatus, setParseStatus] = useState("idle");

  const handleUrlParse = async () => {
    if (!socialUrl.trim() || !isValidUrl(socialUrl)) return;

    setIsParsingUrl(true);
    setError("");
    setSocialData(null);
    setParseStatus("parsing");

    try {
      const platform = detectPlatformFromUrl(socialUrl);
      console.log("🔍 Detected platform:", platform);

      const data = await fetchSocialMediaData(socialUrl, platform);
      console.log("📊 Fetched social data:", data);

      if (data) {
        setSocialData(data);
        setParseStatus("success");

        const tokenData = await generateTokenFromSocialData(data);
        console.log("🎯 Generated token data:", tokenData);

        setFormData((prev) => ({
          ...prev,
          ...tokenData,
        }));
      }
    } catch (err) {
      console.error("Error parsing social media URL:", err);
      setError(
        err.message ||
          "Failed to parse social media URL. Please try a different URL."
      );
      setParseStatus("error");
    } finally {
      setIsParsingUrl(false);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setSocialUrl(url);
    setError("");
    setParseStatus("idle");

    // Auto-detect platform
    const platform = detectPlatformFromUrl(url);
    setSelectedPlatform(platform || "");
  };

  const detectPlatformFromUrl = (url) => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be"))
      return "youtube";
    if (urlLower.includes("reddit.com")) return "reddit";
    if (urlLower.includes("twitter.com") || urlLower.includes("x.com"))
      return "twitter";
    if (urlLower.includes("tiktok.com")) return "tiktok";
    if (urlLower.includes("instagram.com")) return "instagram";
    if (urlLower.includes("farcaster.xyz") || urlLower.includes("warpcast.com"))
      return "farcaster";
    return null;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const canProceed =
    socialData && formData.name && formData.symbol && formData.description;

  // Filter working platforms
  const workingPlatforms = SUPPORTED_PLATFORMS.filter(
    (p) => platformStatus[p.value]?.working
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Modern Header - inspired by AI-Powered Creation */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Social Media Import
            </h3>
            <span className="px-3 py-1 text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full border border-orange-200 dark:border-orange-700/50">
              BETA
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Transform your favorite social content into unique digital tokens.
            Extract images and content from major social platforms.
          </p>
        </div>
      </div>

      {/* Minimal Working Platforms */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {workingPlatforms.map((platform) => {
            const IconComponent = platformIcons[platform.value] || Hash;
            const isSelected = selectedPlatform === platform.value;
            const status = platformStatus[platform.value];

            return (
              <div
                key={platform.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer border backdrop-blur-sm ${
                  isSelected
                    ? status.color === "red"
                      ? "bg-red-100/90 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300/60 dark:border-red-600/60"
                      : status.color === "orange"
                      ? "bg-orange-100/90 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300/60 dark:border-orange-600/60"
                      : status.color === "blue"
                      ? "bg-blue-100/90 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300/60 dark:border-blue-600/60"
                      : status.color === "pink"
                      ? "bg-pink-100/90 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-300/60 dark:border-pink-600/60"
                      : status.color === "purple"
                      ? "bg-purple-100/90 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300/60 dark:border-purple-600/60"
                      : status.color === "indigo"
                      ? "bg-indigo-100/90 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-300/60 dark:border-indigo-600/60"
                      : "bg-slate-100/90 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-300/60 dark:border-slate-600/60"
                    : "bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-white/80 dark:border-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-700/80"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{platform.name}</span>
                {isSelected && (
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status.color === "red"
                        ? "bg-red-400"
                        : status.color === "orange"
                        ? "bg-orange-400"
                        : status.color === "blue"
                        ? "bg-blue-400"
                        : status.color === "pink"
                        ? "bg-pink-400"
                        : status.color === "purple"
                        ? "bg-purple-400"
                        : status.color === "indigo"
                        ? "bg-indigo-400"
                        : "bg-slate-400"
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced URL Input */}
      <div className="space-y-5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Social Media Post URL
        </label>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative group">
              <input
                type="url"
                value={socialUrl}
                onChange={handleUrlChange}
                placeholder="https://youtube.com/watch?v=..., https://twitter.com/..., https://tiktok.com/@..., https://instagram.com/p/..."
                className={`w-full px-5 py-4 pl-14 pr-5 border rounded-2xl transition-all duration-300 backdrop-blur-sm
                         bg-white/70 dark:bg-slate-800/70 
                         text-slate-800 dark:text-white
                         placeholder-slate-400 dark:placeholder-slate-500
                         shadow-sm group-hover:shadow-lg focus:shadow-xl
                         ${
                           parseStatus === "success"
                             ? "border-emerald-300/60 dark:border-emerald-600/60 focus:ring-2 focus:ring-emerald-500/30"
                             : parseStatus === "error"
                             ? "border-red-300/60 dark:border-red-600/60 focus:ring-2 focus:ring-red-500/30"
                             : "border-white/80 dark:border-slate-700/60 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400/60 dark:focus:border-indigo-500/60"
                         }`}
                disabled={isParsingUrl}
              />

              <div className="absolute inset-y-0 left-4 flex items-center">
                {selectedPlatform &&
                platformStatus[selectedPlatform]?.working ? (
                  <div className="relative p-1">
                    {React.createElement(
                      platformIcons[selectedPlatform] || Link2,
                      {
                        className: `w-6 h-6 ${
                          platformStatus[selectedPlatform].color === "red"
                            ? "text-red-500"
                            : platformStatus[selectedPlatform].color ===
                              "orange"
                            ? "text-orange-500"
                            : platformStatus[selectedPlatform].color === "blue"
                            ? "text-blue-500"
                            : platformStatus[selectedPlatform].color === "pink"
                            ? "text-pink-500"
                            : platformStatus[selectedPlatform].color ===
                              "purple"
                            ? "text-purple-500"
                            : platformStatus[selectedPlatform].color ===
                              "indigo"
                            ? "text-indigo-500"
                            : "text-slate-500"
                        }`,
                      }
                    )}
                    <div
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse ${
                        platformStatus[selectedPlatform].color === "red"
                          ? "bg-red-400"
                          : platformStatus[selectedPlatform].color === "orange"
                          ? "bg-orange-400"
                          : platformStatus[selectedPlatform].color === "blue"
                          ? "bg-blue-400"
                          : platformStatus[selectedPlatform].color === "pink"
                          ? "bg-pink-400"
                          : platformStatus[selectedPlatform].color === "purple"
                          ? "bg-purple-400"
                          : platformStatus[selectedPlatform].color === "indigo"
                          ? "bg-indigo-400"
                          : "bg-slate-400"
                      }`}
                    ></div>
                  </div>
                ) : (
                  <Link2 className="w-6 h-6 text-slate-400" />
                )}
              </div>
            </div>

            <button
              onClick={handleUrlParse}
              disabled={
                !socialUrl.trim() || !isValidUrl(socialUrl) || isParsingUrl
              }
              className={`py-2 px-8 rounded-lg font-semibold transition-all duration-300 flex items-center shadow-sm hover:shadow-lg disabled:cursor-not-allowed  ${
                !socialUrl.trim() || !isValidUrl(socialUrl) || isParsingUrl
                  ? "border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "border border-indigo-300 dark:border-indigo-600/50 bg-indigo-50 dark:bg-indigo-600/10 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400"
              }`}
            >
              {isParsingUrl ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Parse</span>
                </>
              )}
            </button>
          </div>

          {/* Status Indicator */}
          {parseStatus !== "idle" && (
            <StatusIndicator
              status={parseStatus}
              message={
                parseStatus === "parsing"
                  ? "Analyzing content and extracting metadata..."
                  : parseStatus === "success"
                  ? "Content successfully imported and ready for token creation!"
                  : parseStatus === "error"
                  ? "Failed to parse content. Please check the URL and try again."
                  : "Ready to parse your social media content"
              }
            />
          )}

          {error && (
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50/90 dark:bg-red-900/30 border border-red-200/60 dark:border-red-700/40 backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  {error}
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80">
                  Try using YouTube, Reddit, Twitter/X, TikTok, Instagram, or
                  Farcaster links.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Social Data Preview */}
      {socialData && (
        <div className="backdrop-blur-sm  rounded-3xl border border-white/80 dark:border-slate-700/60 p-8 shadow-2xl shadow-slate-900/5 dark:shadow-slate-900/20">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative p-4 rounded-2xl bg-emerald-100/90 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-700/50">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                Content Imported Successfully
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                From {socialData.platform} • Ready for token creation
              </p>
            </div>
          </div>

          {/* Enhanced Author Card */}
          <div className="flex items-center gap-6 p-4 rounded-2xl mb-8 border border-white/90 dark:border-slate-600/60 backdrop-blur-sm">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-xl">
                {socialData.author?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-slate-800 dark:text-white text-base">
                {socialData.author?.name || "Unknown Creator"}
              </h5>
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-1">
                <span>@{socialData.author?.username || "unknown"}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {React.createElement(
                    platformIcons[socialData.platform] || Globe,
                    {
                      className: "w-4 h-4",
                    }
                  )}
                  <span className="capitalize font-medium">
                    {socialData.platform}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Display */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 block flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Content
              </label>
              <div className="relative p-6 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-white/90 dark:border-slate-600/50 backdrop-blur-sm">
                <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm">
                  {socialData.text || "No text content available"}
                </p>
                {socialData.text && socialData.text.length > 100 && (
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Images Display */}
            {(socialData.thumbnail ||
              (socialData.images && socialData.images.length > 0)) && (
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 block flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Media
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {socialData.thumbnail && (
                    <div className="relative group overflow-hidden rounded-2xl border border-white/90 dark:border-slate-600/60 backdrop-blur-sm shadow-lg">
                      <img
                        src={socialData.thumbnail}
                        alt="Content thumbnail"
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="p-1 rounded-lg bg-white/20 backdrop-blur-sm">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  {socialData.images &&
                    socialData.images
                      .slice(0, socialData.thumbnail ? 3 : 4)
                      .map((image, index) => (
                        <div
                          key={index}
                          className="relative group overflow-hidden rounded-2xl border border-white/90 dark:border-slate-600/60 backdrop-blur-sm shadow-lg"
                        >
                          <img
                            src={image}
                            alt={`Social media image ${index + 1}`}
                            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="p-1 rounded-lg bg-white/20 backdrop-blur-sm">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}

            {/* Stats if available */}
            {socialData.stats && (
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 block">
                  Engagement Stats
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {socialData.stats.upvotes !== undefined && (
                    <div className="text-center p-4 rounded-xl bg-white/70 dark:bg-slate-700/60 border border-white/80 dark:border-slate-600/50">
                      <ThumbsUp className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                      <div className="text-lg font-bold text-slate-800 dark:text-white">
                        {socialData.stats.upvotes}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Upvotes
                      </div>
                    </div>
                  )}
                  {socialData.stats.comments !== undefined && (
                    <div className="text-center p-4 rounded-xl bg-white/70 dark:bg-slate-700/60 border border-white/80 dark:border-slate-600/50">
                      <MessageSquare className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                      <div className="text-lg font-bold text-slate-800 dark:text-white">
                        {socialData.stats.comments}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Comments
                      </div>
                    </div>
                  )}
                  {socialData.stats.score !== undefined && (
                    <div className="text-center p-4 rounded-xl bg-white/70 dark:bg-slate-700/60 border border-white/80 dark:border-slate-600/50">
                      <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                      <div className="text-lg font-bold text-slate-800 dark:text-white">
                        {socialData.stats.score}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Score
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Generated Token Preview */}
      {formData.name && formData.symbol && (
        <div className="backdrop-blur-sm bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-3xl border border-emerald-200/60 dark:border-emerald-700/40 p-8 shadow-2xl shadow-emerald-500/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-emerald-100/90 dark:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-700/50">
              <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              Your Token Details
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Token Name
              </label>
              <p className="font-bold text-slate-800 dark:text-white text-base">
                {formData.name}
              </p>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Symbol
              </label>
              <p className="font-bold text-slate-800 dark:text-white text-base">
                {formData.symbol}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Description
            </label>
            <p className="text-slate-800 dark:text-slate-100 leading-relaxed p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-white/80 dark:border-slate-600/40 backdrop-blur-sm">
              {formData.description}
            </p>
          </div>

          {/* Show token image preview */}
          {(socialData?.thumbnail || socialData?.images?.[0]) && (
            <div className="mt-6 space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Token Image
              </label>
              <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/80 dark:border-slate-600/40 shadow-lg">
                <img
                  src={socialData?.thumbnail || socialData?.images?.[0]}
                  alt="Token image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons - matching other steps */}
      <div className="flex justify-between pt-6">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300 font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={goToNextStep}
          disabled={!canProceed}
          className={`px-6 py-2 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 ${
            !canProceed
              ? "border border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "border border-indigo-300 dark:border-indigo-600/50 bg-indigo-50 dark:bg-indigo-600/10 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400"
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SocialMediaStep;
