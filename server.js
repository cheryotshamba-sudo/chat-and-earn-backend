const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Store payment status in memory
const payments = {};

// Home route
app.get("/", (req, res) => {
    res.send("Chat and Earn Backend Running 🚀");
});

// STK Push
app.post("/stkpush", async (req, res) => {

    try {

        let { phone, amount } = req.body;

        // Convert 07XXXXXXXX to 2547XXXXXXXX
        if (phone.startsWith("0")) {
            phone = "254" + phone.substring(1);
        }

        console.log("Sending STK Push to:", phone);

        const response = await axios.post(
            "https://optimapaybridge.co.ke/api/topup.php",
            {
                phone,
                amount,
                user_callback_url:
                    "https://chat-and-earn-backend-1.onrender.com/callback"
            },
            {
                headers: {
                    "X-API-KEY": process.env.OPTIMA_API_KEY,
                    "X-API-SECRET": process.env.OPTIMA_API_SECRET,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(response.data);

        if (response.data.checkout_request_id) {

            payments[response.data.checkout_request_id] = "pending";

        }

        res.json(response.data);

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).json({
            success: false,
            message: "Failed to send STK Push"
        });

    }

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
