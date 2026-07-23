const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Store payment status
const payments = {};

// Home route
app.get("/", (req, res) => {
    res.send("Chat and Earn Backend Running 🚀");
});

// Initiate STK Push
app.post("/stkpush", async (req, res) => {
    try {
        let { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        // Convert 07XXXXXXXX to 2547XXXXXXXX
        if (phone.startsWith("0")) {
            phone = "254" + phone.substring(1);
        }

        const reference = "CHAT-" + Date.now();

        const response = await axios.post(
    "https://autopay.co.ke/api/stk-push",
    {
        merchantId: process.env.AUTOPAY_MERCHANT_ID,
        amount: 10,
        phone: phone,
        accountReference: reference,
        description: "Chat and Earn Activation",
        callbackUrl: "https://chat-and-earn-backend.onrender.com/callback"
    },
            {
                headers: {
                    Authorization: `Bearer ${process.env.AUTOPAY_SECRET_KEY}`,
                    
                    "Content-Type": "application/json",
                    Accept: "application/json"
                }
            }
        );

        payments[reference] = {
            status: "pending",
            checkoutRequestId: response.data.checkoutRequestId || null,
            merchantRequestId: response.data.merchantRequestId || null
        };

        res.json({
            success: true,
            reference,
            checkoutRequestId: response.data.checkoutRequestId,
            message: response.data.message
        });

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).json({
            success: false,
            message: err.response?.data?.message || "Failed to send STK Push"
        });

    }
});

// AUTOPAY Callback
app.post("/callback", (req, res) => {

    const data = req.body;

    console.log("AUTOPAY Callback:", data);

    if (data.reference) {

        payments[data.reference] = {
            status: data.status,
            amount: data.amount,
            phone: data.phone
        };

    }

    res.status(200).json({
        success: true
    });

});

// Check Payment Status
app.get("/payment-status/:reference", (req, res) => {

    const payment = payments[req.params.reference];

    if (!payment) {
        return res.json({
            success: false,
            status: "not_found"
        });
    }

    res.json({
        success: true,
        payment
    });

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
