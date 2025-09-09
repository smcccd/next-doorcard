interface ResultsHeaderProps {
  totalCount: number;
  filteredCount: number;
  hasFilters: boolean;
}

export function ResultsHeader({
  totalCount,
  filteredCount,
  hasFilters,
}: ResultsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="text-gray-700">
        {hasFilters ? (
          <span>
            Showing <span className="font-semibold">{filteredCount}</span> of{" "}
            <span className="font-semibold">{totalCount}</span> faculty members
          </span>
        ) : (
          <span>
            Showing{" "}
            <span className="font-semibold">{Math.min(filteredCount, 24)}</span>{" "}
            of <span className="font-semibold">{totalCount}</span> faculty
            members
            {totalCount > 24 && (
              <span className="text-gray-500 ml-1">
                (use filters to see more)
              </span>
            )}
          </span>
        )}
      </div>

      <div className="text-sm text-gray-500">
        {hasFilters && filteredCount === 0 && (
          <span>No results found. Try adjusting your filters.</span>
        )}
      </div>
    </div>
  );
}
