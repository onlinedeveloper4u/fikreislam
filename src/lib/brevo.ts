
export async function sendEmail({ to, subject, htmlContent }: { to: { email: string; name?: string }[]; subject: string; htmlContent: string }) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY is not set');
    return { success: false, error: 'API key not configured' };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'فکر اسلام',
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to,
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
