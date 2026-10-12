import { useEffect, useState } from "react";

const EMPTY_LIST = [];

export default function useRemoteResource(load, { enabled = true, initialValue = EMPTY_LIST } = {}) {
    const [data, setData] = useState(initialValue);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState("");
    const [isWakingUp, setIsWakingUp] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!enabled) return undefined;

        let active = true;
        const wakeTimer = window.setTimeout(() => {
            if (active) setIsWakingUp(true);
        }, 4000);

        setLoading(true);
        setError("");
        setIsWakingUp(false);

        Promise.resolve()
            .then(load)
            .then((value) => {
                if (active) setData(value ?? initialValue);
            })
            .catch((requestError) => {
                if (active) setError(requestError?.message || "Please try again.");
            })
            .finally(() => {
                window.clearTimeout(wakeTimer);
                if (active) {
                    setLoading(false);
                    setIsWakingUp(false);
                }
            });

        return () => {
            active = false;
            window.clearTimeout(wakeTimer);
        };
    }, [attempt, enabled, initialValue, load]);

    return {
        data,
        loading,
        error,
        isWakingUp,
        retry: () => setAttempt((current) => current + 1),
    };
}