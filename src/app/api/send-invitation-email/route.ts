import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

// Initialize Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, itineraryId, itineraryTitle, inviterName, permission } =
      body;

    if (!email || !itineraryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get itinerary details
    const { data: itinerary, error: itineraryError } = await supabaseAdmin
      .from("itineraries")
      .select("title, user_id")
      .eq("id", itineraryId)
      .single();

    if (itineraryError || !itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    // Get inviter details
    const { data: inviter } = await supabaseAdmin.auth.admin.getUserById(
      itinerary.user_id
    );

    const inviterEmail = inviter?.user?.email || "một người dùng";
    const inviterDisplayName = inviterName || inviterEmail;

    // Get the app URL
    let appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // If not set, try to get from Vercel environment
    if (!appUrl && process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    }

    // If still not set, try to get from request headers (for production)
    if (!appUrl) {
      const host = request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      if (host) {
        appUrl = `${protocol}://${host}`;
      }
    }

    // Fallback to localhost for development
    if (!appUrl) {
      appUrl = "http://localhost:3000";
    }

    console.log("App URL:", appUrl);

    // Email content
    const emailSubject = `Bạn đã được mời cộng tác trên lịch trình: ${
      itinerary.title || itineraryTitle
    }`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Lời mời cộng tác</h1>
            </div>
            <div class="content">
              <p>Xin chào,</p>
              <p><strong>${inviterDisplayName}</strong> đã mời bạn cộng tác trên lịch trình:</p>
              <h2 style="color: #667eea;">${
                itinerary.title || itineraryTitle
              }</h2>
              <p>Quyền truy cập: <strong>${
                permission === "edit" ? "Chỉnh sửa" : "Đọc"
              }</strong></p>
              <p>Vui lòng đăng nhập vào ứng dụng để xem và chấp nhận lời mời.</p>
              <a href="${appUrl}/dashboard" class="button" style="color: white;">Xem lời mời</a>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Nếu bạn không mong đợi email này, bạn có thể bỏ qua nó.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Vivu-Go. Tất cả quyền được bảo lưu.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Try to send email using Resend if available
    if (process.env.RESEND_API_KEY) {
      console.log("Attempting to send email via Resend to:", email);

      // Use Resend's test domain if no custom domain is configured
      // For testing: use onboarding@resend.dev (automatically verified)
      // For production: verify your own domain in Resend Dashboard
      const fromEmail =
        process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

      console.log("Sending from:", fromEmail);

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: emailSubject,
          html: emailBody,
        }),
      });

      const resendData = await resendResponse.json();

      if (resendResponse.ok) {
        console.log("Email sent successfully via Resend:", resendData);
        return NextResponse.json({
          success: true,
          message: "Email sent via Resend",
          emailId: resendData.id,
        });
      } else {
        console.error("Resend API error:", {
          status: resendResponse.status,
          statusText: resendResponse.statusText,
          data: resendData,
        });
        // Fall through to try SMTP if Resend fails
      }
    }

    // Try to send email using SMTP (Gmail, etc.) if configured
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      console.log("Attempting to send email via SMTP to:", email);

      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: emailSubject,
          html: emailBody,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent successfully via SMTP:", info.messageId);
        return NextResponse.json({
          success: true,
          message: "Email sent via SMTP",
          messageId: info.messageId,
        });
      } catch (smtpError) {
        const errorMessage =
          smtpError instanceof Error ? smtpError.message : String(smtpError);
        console.error("SMTP error:", smtpError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to send email via SMTP",
            details: errorMessage,
            message:
              errorMessage ||
              "SMTP configuration error. Please check SMTP settings.",
          },
          { status: 500 }
        );
      }
    }

    // No email service configured
    console.warn(
      "Email service not configured. RESEND_API_KEY or SMTP settings are missing."
    );
    console.log("Email invitation details (NOT SENT):", {
      to: email,
      subject: emailSubject,
      body: emailBody.substring(0, 200) + "...",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Email service not configured",
        message:
          "Please configure RESEND_API_KEY or SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS) to send invitation emails.",
        emailDetails: {
          to: email,
          subject: emailSubject,
        },
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
