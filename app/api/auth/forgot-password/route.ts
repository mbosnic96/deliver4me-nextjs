import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbConnect } from '@/lib/db/db';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ message: 'Korisnik ne postoji u bazi podataka!' }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 sat

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 40px 0;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px; text-align: center;">
          <img src="https://deliver4me.ba/logo.png" alt="Deliver4ME" style="max-width: 150px; margin-bottom: 20px;" />
          <h2 style="color: #2563eb;">Resetovanje Lozinke</h2>
          <p style="font-size: 15px; color: #333; margin-bottom: 20px;">
            Poštovani ${user.name || 'korisniče'}, primili smo zahtjev za resetovanje vaše lozinke na <strong>Deliver4ME</strong>.
          </p>
          <p style="font-size: 14px; color: #555; margin-bottom: 25px;">
            Ako ste vi podnijeli zahtjev, kliknite na dugme ispod da postavite novu lozinku.  
            Link će biti aktivan narednih <strong>60 minuta</strong>.
          </p>
          <a href="${resetUrl}" 
             style="display:inline-block; background-color:#2563eb; color:white; padding:12px 25px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:15px;">
             Resetuj Lozinku
          </a>
          <p style="font-size: 13px; color: #777; margin-top: 30px;">
            Ako niste tražili reset lozinke, slobodno ignorišite ovu poruku.  
            Vaša postojeća lozinka će ostati nepromijenjena.
          </p>
          <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Deliver4ME. Sva prava zadržana.
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      user.email,
      'Resetovanje Lozinke - Deliver4ME',
      `Kliknite na link da resetujete lozinku: ${resetUrl}`,
      htmlContent
    );

    return NextResponse.json({ message: 'Email za resetovanje lozinke je uspješno poslan!' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Došlo je do interne greške na serveru.' }, { status: 500 });
  }
}
