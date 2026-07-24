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

        console.log({
            phone,
            amount: 10,
            balanceType: "wallet"
        });

        const response = await axios.post(
            "https://autopay.co.ke/api/stk-push",
            {
                phone,
                amount: 10,
                balanceType: "wallet"
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
            checkoutRequestId: response.data.data?.checkout_request_id || null,
            merchantRequestId: response.data.data?.merchant_request_id || null
        };

        return res.json({
            success: true,
            reference,
            checkoutRequestId: response.data.data?.checkout_request_id || null,
            merchantRequestId: response.data.data?.merchant_request_id || null,
            message: response.data.message || "STK Push sent successfully"
        });

    } catch (err) {
        console.error("Status:", err.response?.status);
        console.error("Response:", err.response?.data);

        return res.status(err.response?.status || 500).json({
            success: false,
            message: err.response?.data?.message || "Failed to send STK Push"
        });
    }
});

// Callback
app.post("/callback", (req, res) => {
    const data = req.body;

    console.log("AUTOPAY CALLBACK:", data);

    if (data.reference) {
        payments[data.reference] = {
            status: data.status || "completed",
            amount: data.amount,
            phone: data.phone,
            transactionCode: data.transactionCode || null
        };
    }

    res.status(200).json({ success: true });
});

// Check payment status
// Check payment status
app.get("/payment-status/:reference", async (req, res) => {
    const payment = payments[req.params.reference];

    if (!payment) {
        return res.json({
            success: false,
            status: "not_found"
        });
    }

    try {
        // If we don't have a checkout request ID yet, just return what we know
        if (!payment.checkoutRequestId) {
            return res.json({
                success: true,
                payment
            });
        }

        // Ask AUTOPAY for the latest payment status
       const response = await axios.post(
    "https://autopay.co.ke/api/check-status",
    {
        checkout_request_id: payment.checkoutRequestId
    }, 
            {
                headers: {
                    Authorization: `Bearer ${process.env.AUTOPAY_SECRET_KEY}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                }
            }
        );

        // Update the stored payment status
        if (response.data.success) {
            payment.status =
                response.data.data?.transaction?.status ||
                response.data.status ||
                payment.status;
        }

        return res.json({
            success: true,
            payment
        });

    } catch (err) {
        console.error("Status check error:", err.response?.data || err.message);

        return res.json({
            success: true,
            payment
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
