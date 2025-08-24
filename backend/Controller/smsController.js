const axios = require('axios');

exports.sendWhatsappMessage = async (req, res) => {
  try {
    const { name, email, subject, phoneNo, whatsappNo, message } = req.body;
   
    // Validate required fields
    if (!name || !email || !subject || !phoneNo || !whatsappNo || !message ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject, and message are required",
      });
    }

    // Check message length (limit to 1000 characters)
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message exceeds maximum length of 1000 characters",
      });
    }

    // Get token and API URL from environment variables
    const token = process.env.WHATSAPP_API_TOKEN;
    const apiUrl = process.env.API_URL;
    const receiverPhone = process.env.RECEIVE_PHONE;

    if (!token || !apiUrl || !receiverPhone) {
      throw new Error("API token, URL, or receiver phone number is missing in environment variables.");
    }

    // Construct the message text
    const fullMessage = `New Contact Request:
- Name: ${name}
- Email: ${email}
- Subject: ${subject}
- Phone No: ${phoneNo }
- WhatsApp No: ${whatsappNo }
- Message: ${message}`;

    // Make GET request to external API
    const response = await axios.get(apiUrl, {
      params: {
        receiver: receiverPhone,
        msgtext: fullMessage,
        token: token,
      },
    });

    // Check API response and determine success
    if (response.data.success === true) {
      return res.status(200).json({
        success: true,
        message: "Message sent successfully",
       
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send message",
        details: response.data,
      });
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred",
    });
  }
};
