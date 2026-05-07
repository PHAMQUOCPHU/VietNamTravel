import { useState, useEffect, useCallback, useContext } from "react";
import { AppContext } from "../../context";
import { getBlogs } from "../../services";

export const useBlogs = (filters = {}) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const { backendUrl } = useContext(AppContext);
  const {
    category = "all",
    date = "",
    search = "",
  } = filters;

  const fetchBlogs = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        const data = await getBlogs({
          backendUrl,
          category,
          date,
          search,
          signal,
        });
        if (!signal?.aborted && data.success) {
          const list = data.blogs || [];
          setBlogs(list);
          const fromRoot =
            typeof data.totalItems === "number" ? data.totalItems : null;
          const fromPag =
            typeof data.pagination?.totalItems === "number"
              ? data.pagination.totalItems
              : null;
          setTotalItems(fromRoot ?? fromPag ?? list.length);
        }
      } catch (error) {
        if (
          error.code !== "ERR_CANCELED" &&
          error.name !== "CanceledError"
        ) {
          if (import.meta.env.DEV) {
            console.warn("[blogs] fetch failed", error);
          }
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [backendUrl, category, date, search],
  );

  useEffect(() => {
    const ac = new AbortController();
    fetchBlogs(ac.signal);
    return () => ac.abort();
  }, [fetchBlogs]);

  return { blogs, loading, totalItems };
};
