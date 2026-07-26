import Link from "next/link";
import { Domain } from "@/generated/prisma/client";

const DOMAINS: Domain[] = ["MEAL", "MOVIE", "GAME", "TRAVEL"];

export function DomainTabs({ basePath, selected }: { basePath: string; selected?: Domain }) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-lg bg-zinc-100 p-1 text-sm">
      <Link
        href={basePath}
        className={`rounded-md px-3 py-1.5 whitespace-nowrap ${
          !selected ? "bg-white font-semibold shadow-sm" : "text-zinc-500"
        }`}
      >
        All
      </Link>
      {DOMAINS.map((d) => (
        <Link
          key={d}
          href={`${basePath}?domain=${d}`}
          className={`rounded-md px-3 py-1.5 whitespace-nowrap ${
            selected === d ? "bg-white font-semibold shadow-sm" : "text-zinc-500"
          }`}
        >
          {d}
        </Link>
      ))}
    </nav>
  );
}
