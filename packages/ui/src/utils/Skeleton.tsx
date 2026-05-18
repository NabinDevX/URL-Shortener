import React from "react";

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width = "100%",
  height = "20px",
  animation = "pulse",
}) => {
  const baseClasses =
    "bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600";

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  };

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = "" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={i === lines - 1 ? "16px" : "20px"}
          width={i === lines - 1 ? "80%" : "100%"}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{
  hasImage?: boolean;
  className?: string;
}> = ({ hasImage = true, className = "" }) => {
  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 ${className}`}
    >
      {hasImage && <Skeleton variant="rectangular" height="200px" />}
      <Skeleton variant="text" height="24px" width="70%" />
      <SkeletonText lines={2} />
    </div>
  );
};

export const SkeletonTableRow: React.FC<{
  columns?: number;
  className?: string;
}> = ({ columns = 4, className = "" }) => {
  return (
    <div className={`flex gap-4 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="flex-1">
          <Skeleton variant="text" height="20px" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className = "" }) => {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default Skeleton;
