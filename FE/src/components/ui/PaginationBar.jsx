import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function getVisiblePages(currentPage, totalPages) {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i += 1
  ) {
    range.push(i);
  }
  if (currentPage - delta > 2) {
    rangeWithDots.push(1, "...");
  } else {
    rangeWithDots.push(1);
  }
  rangeWithDots.push(...range);
  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push("...", totalPages);
  } else if (totalPages > 1) {
    rangeWithDots.push(totalPages);
  }
  return rangeWithDots;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) {
  return (
    <Pagination className={"justify-center " + className}>
      <PaginationContent>
        <PaginationItem>
          <button
            type="button"
            disabled={currentPage <= 1}
            aria-label="Trang trước"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-w-8 px-2 text-base",
              currentPage <= 1 ? "opacity-50 pointer-events-none" : ""
            )}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          >
            <span aria-hidden>‹</span>
          </button>
        </PaginationItem>
        {getVisiblePages(currentPage, totalPages).map((page, idx) =>
          page === "..." ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <button
                type="button"
                aria-current={page === currentPage ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: page === currentPage ? "default" : "outline",
                    size: "sm",
                  }),
                  "min-w-8 px-2 text-base",
                  page === currentPage ? "!bg-green-400 !text-white !border-green-400" : ""
                )}
                onClick={() => onPageChange(Number(page))}
              >
                {page}
              </button>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            aria-label="Trang sau"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-w-8 px-2 text-base",
              currentPage >= totalPages ? "opacity-50 pointer-events-none" : ""
            )}
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          >
            <span aria-hidden>›</span>
          </button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
