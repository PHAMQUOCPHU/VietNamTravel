/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const ShopContext = createContext(null);

const ShopContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [tours, setTours] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await axios.get(backendUrl + "/api/tour/list");
        if (cancelled) return;
        if (response.data.success) {
          setTours(response.data.tours);
        } else {
          toast.error(response.data.message);
        }
      } catch (err) {
        console.log(err);
        toast.error(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [backendUrl]);

  const value = {
    tours,
    backendUrl,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
