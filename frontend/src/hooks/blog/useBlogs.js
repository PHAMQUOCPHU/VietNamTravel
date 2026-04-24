import { useState, useEffect, useCallback, useContext } from "react";
import { AppContext } from "../../context";
import { getBlogs } from "../../services";

export const useBlogs = (filters = {}) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { backendUrl } = useContext(AppContext);
  const { category = "all", date = "" } = filters;

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBlogs({ backendUrl, category, date });
      if (data.success) {
        setBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, category, date]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return { blogs, loading };
};
