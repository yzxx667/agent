"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useRouterStore } from "@/lib/stores/routerStore";
import { useCallback } from "react";

/**
 * 优化的 useRouter Hook
 * 自动在路由切换时显示加载状态
 *
 * 使用方式：
 * const router = useOptimizedRouter();
 * router.push('/path'); // 自动显示加载指示器
 */
export function useOptimizedRouter() {
  const router = useNextRouter();
  const setIsLoading = useRouterStore((state) => state.setIsLoading);

  const push = useCallback(
    (url: string, options?: any) => {
      setIsLoading(true);
      router.push(url, options);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    },
    [router, setIsLoading]
  );

  const replace = useCallback(
    (url: string, options?: any) => {
      setIsLoading(true);
      router.replace(url, options);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    },
    [router, setIsLoading]
  );

  const back = useCallback(() => {
    setIsLoading(true);
    router.back();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [router, setIsLoading]);

  const forward = useCallback(() => {
    setIsLoading(true);
    router.forward();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [router, setIsLoading]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    router.refresh();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [router, setIsLoading]);

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch: router.prefetch,
  };
}
