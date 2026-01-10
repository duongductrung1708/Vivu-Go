import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const { email, itineraryId, itineraryTitle, inviterName, permission } = body;

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   "http://localhost:3000";

    // Email content
    const emailSubject = `Bạn đã được mời cộng tác trên lịch trình: ${itinerary.title || itineraryTitle}`;
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
              <h2 style="color: #667eea;">${itinerary.title || itineraryTitle}</h2>
              <p>Quyền truy cập: <strong>${permission === "edit" ? "Chỉnh sửa" : "Đọc"}</strong></p>
              <p>Vui lòng đăng nhập vào ứng dụng để xem và chấp nhận lời mời.</p>
              <a href="${appUrl}/dashboard" class="button">Xem lời mời</a>
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
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "noreply@vivu-go.com",
          to: email,
          subject: emailSubject,
          html: emailBody,
        }),
      });

      if (resendResponse.ok) {
        return NextResponse.json({ success: true, message: "Email sent via Resend" });
      }
    }

    // Fallback: Use Supabase Auth email (if configured)
    // Note: This requires Supabase email templates to be configured
    // For now, we'll just log that email should be sent
    console.log("Email invitation details:", {
      to: email,
      subject: emailSubject,
      body: emailBody,
    });

    // In production, you should configure an email service
    // For now, return success but log that email needs to be sent manually
    return NextResponse.json({
      success: true,
      message: "Invitation created. Email service not configured. Please configure RESEND_API_KEY or another email service.",
      emailDetails: {
        to: email,
        subject: emailSubject,
      },
    });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
