import axios from "axios";

// API Thêm Tour
export const addTourApi = async (formData, token, backendUrl) => {
  const url = `${backendUrl.trim()}/api/tour/add`;
  console.log("🚀 Request gửi đến:", url);

  const { data } = await axios.post(url, formData, {
    // SỬA: token -> atoken
    headers: { atoken: token },
  });
  return data;
};

// API Lấy danh sách Tour
export const listToursApi = async (
  token,
  backendUrl,
  includeInactive = false,
) => {
  const { data } = await axios.get(`${backendUrl.trim()}/api/tour/list`, {
    params: { includeInactive: includeInactive ? "true" : undefined },
    // SỬA: token -> atoken
    headers: { atoken: token },
  });
  return data;
};

// API Xóa Tour
export const removeTourApi = async (id, token, backendUrl) => {
  const { data } = await axios.post(
    `${backendUrl.trim()}/api/tour/remove`,
    { id },
    // SỬA: token -> atoken
    { headers: { atoken: token } },
  );
  return data;
};

// Hàm lấy 1 tour duy nhất (Không cần token vì là view công khai)
export const getSingleTourApi = async (id, backendUrl) => {
  const response = await axios.get(
    `${backendUrl.trim()}/api/tour/single/${id}`,
  );
  return response.data;
};

// Hàm gửi dữ liệu cập nhật lên server
export const updateTourApi = async (id, formData, token, backendUrl) => {
  const response = await axios.post(
    `${backendUrl.trim()}/api/tour/update/${id}`,
    formData,
    {
      // SỬA: token -> atoken
      headers: { atoken: token },
    },
  );
  return response.data;
};

export const toggleTourStatusApi = async (id, isActive, token, backendUrl) => {
  const { data } = await axios.post(
    `${backendUrl.trim()}/api/tour/toggle-status`,
    { id, isActive },
    { headers: { atoken: token } },
  );
  return data;
};

export const listOnSaleToursApi = async (token, backendUrl) => {
  const { data } = await axios.get(`${backendUrl.trim()}/api/tour/on-sale`, {
    headers: { atoken: token },
  });
  return data;
};

export const updateSaleToursApi = async (payload, token, backendUrl) => {
  const { data } = await axios.post(
    `${backendUrl.trim()}/api/tour/update-sale`,
    payload,
    { headers: { atoken: token } },
  );
  return data;
};
