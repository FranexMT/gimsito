"use client";

import Image from "next/image";
import { useState } from "react";
import { Dumbbell } from "lucide-react";

export default function ExerciseGif({
  src,
  alt,
  size = 64,
}: {
  src: string | null;
  alt: string;
  size?: number;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg"
        style={{ width: size, height: size, background: "var(--surface-raised)", color: "var(--text-disabled)" }}
      >
        <Dumbbell size={size * 0.4} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-lg object-cover"
      style={{ background: "var(--surface-raised)" }}
      onError={() => setError(true)}
    />
  );
}
