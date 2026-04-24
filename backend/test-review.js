import axios from 'axios';
import FormData from 'form-data';

const test = async () => {
  try {
    const formData = new FormData();
    formData.append("bookingId", "65e23c8a1b2a3c4d5e6f7g8h");
    formData.append("rating", "5");
    formData.append("comment", "Test comment");
    formData.append("survey", JSON.stringify({ guide: "Hài lòng", transport: "Hài lòng", food: "Hài lòng", schedule: "Hài lòng" }));
    
    // We don't append image to see if it works without image but with FormData
    
    const res = await axios.post("http://localhost:5001/api/reviews", formData, {
      headers: {
        token: "fake-token", // It will fail auth, but let's see if auth fails first
        ...formData.getHeaders()
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
};
test();
