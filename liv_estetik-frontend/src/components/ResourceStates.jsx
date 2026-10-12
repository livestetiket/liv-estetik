export function ResourceSkeleton({ rows = 3, variant = "row" }) {
    return (
        <div className={`resource-skeleton resource-skeleton-${variant}`} aria-label="Loading content" aria-busy="true">
            {Array.from({ length: rows }, (_, index) => (
                <div className="resource-skeleton-item" key={index}>
                    <span />
                    <span />
                </div>
            ))}
        </div>
    );
}

export function ResourceFailure({ message, onRetry }) {
    return (
        <div className="resource-failure" role="alert">
            <p>{message}</p>
            <button type="button" onClick={onRetry}>Try again</button>
        </div>
    );
}

export function WakingMessage() {
    return <p className="resource-waking" role="status">Waking things up, one moment...</p>;
}