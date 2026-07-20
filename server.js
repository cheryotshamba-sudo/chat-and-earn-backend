const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Chat and Earn Backend is running 🚀");
});

app.post("/stkpush", async (req, res) => {
    const { phone, amount } = req.body;

    console.log("STK Request:", phone, amount);

    res.json({
        success: true,
        message: "Backend received the STK request.",
        phone,
        amount
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
