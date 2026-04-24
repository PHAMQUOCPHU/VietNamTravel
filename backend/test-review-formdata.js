import axios from 'axios';
import FormData from 'form-data';

const test = async () => {
  try {
    const formData = new FormData();
    formData.append("bookingId", "65e23c8a1b2a3c4d5e6f7g8h");
    formData.append("rating", "5");
    formData.append("comment", "Test");
    formData.append("survey", JSON.stringify({ guide: "Hài lòng" }));
    // append a fake file
    formData.append("images", Buffer.from("fake image data"), {
      filename: "test.jpg",
      contentType: "image/jpeg",
    });

    const res = await axios.post("http://localhost:5001/api/reviews", formData, {
      headers: {
        token: "fake-token",
        ...formData.getHeaders()
      }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
};
test();
