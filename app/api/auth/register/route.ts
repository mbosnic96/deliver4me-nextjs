import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db/db';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { 
      name,
      email,
      phone,
      address,
      country,
      state,
      city,
      postalCode,
      password,
      role
    } = await request.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }
    


    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      address,
      country,
      state,
      city,
      postalCode,
      password: hashedPassword,
      role: role || 'client',
      failedLoginAttempts: 0,
      lockUntil: null,
      lastFailedLogin: null
    });

    await newUser.save();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 40px 0;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px; text-align: center;">
          <img src="https://deliver4me.ba/logo.png" alt="Deliver4ME" style="max-width: 150px; margin-bottom: 20px;" />
          <h2 style="color: #2563eb;">Dobrodošli na Deliver4ME!</h2>
          <p style="font-size: 15px; color: #333; margin-bottom: 20px;">
            Poštovani ${name || 'korisniče'}, hvala što ste se registrovali na <strong>Deliver4ME</strong>.
          </p>
          <p style="font-size: 14px; color: #555; margin-bottom: 25px;">
            Sada možete pratiti i naručivati dostave putem naše platforme. Ukoliko se radi o grešci, molimo kontaktirajte nas što prije!
          </p>
          <a href="${process.env.NEXTAUTH_URL}" 
             style="display:inline-block; background-color:#2563eb; color:white; padding:12px 25px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:15px;">
             Posjeti platformu
          </a>
          <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Deliver4ME. Sva prava zadržana.
          </p>
        </div>
      </div>
    `;

    await sendEmail(
      newUser.email,
      'Dobrodošli na Deliver4ME',
      `Pozdrav ${name || 'korisniče'}, dobrodošli na Deliver4ME!`,
      htmlContent
    );
    

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
