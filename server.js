const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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
    "https://swiftwallet.co.ke/v3/stk-initiate/",
    {
        amount: 100,
        phone_number: phone,
        channel_id: 604,
        external_reference: reference,
        customer_name: "Chat and Earn User",
        callback_url:
            "https://chat-and-earn-backend.onrender.com/callback"
    },
        
            {
                headers: {
                    Authorization: `Bearer ${process.env.SWIFTWALLET_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        payments[reference] = {
            status: "pending",
            transaction_id: response.data.transaction_id || null,
            checkout_request_id: response.data.checkout_request_id || null
        };

        res.json({
            success: true,
            reference,
            message: response.data.message,
            checkout_request_id: response.data.checkout_request_id
        });

    } catch (err) {
        console.error(
            err.response?.data || err.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to send STK Push"
        });
    }
});

// SwiftWallet Callback
app.post("/callback", (req, res) => {
    try {
        const data = req.body;

        console.log("Callback received:", data);

        const reference = data.external_reference;

        if (reference) {
            payments[reference] = {
                status: data.status || "pending",
                transaction_id: data.transaction_id,
                receipt:
                    data.result?.MpesaReceiptNumber || null,
                amount:
                    data.result?.Amount || null,
                phone:
                    data.result?.Phone || null
            };
        }

        res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false
        });
    }
});

// Check Payment Status
app.get("/payment-status/:reference", (req, res) => {

    const reference = req.params.reference;

    if (!payments[reference]) {
        return res.json({
            success: false,
            status: "not_found"
        });
    }

    res.json({
        success: true,
        payment: payments[reference]
    });

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
