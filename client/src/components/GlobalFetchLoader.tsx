import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import {
  getPendingRequestCount,
  subscribeToNetworkActivity,
} from "@/lib/networkActivity";

type GlobalFetchLoaderProps = {
  disabled?: boolean;
};

export default function GlobalFetchLoader({
  disabled = false,
}: GlobalFetchLoaderProps) {
  const [pendingCount, setPendingCount] = useState(getPendingRequestCount());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeToNetworkActivity(() => {
      setPendingCount(getPendingRequestCount());
    });
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (pendingCount > 0) {
      timer = setTimeout(() => {
        setVisible(true);
      }, 120);
    } else {
      setVisible(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [pendingCount]);

  if (disabled || !visible) {
    return null;
  }

  return <Loader message="Please wait..." />;
}
