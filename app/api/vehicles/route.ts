import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import Vehicle from '@/lib/models/Vehicle'
import { dbConnect } from '@/lib/db/db'

export async function GET() {
  await dbConnect()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vehicles = await Vehicle.find({ userId: session.user.id }).lean()
  return NextResponse.json(vehicles)
}

export async function POST(request: Request) {
  await dbConnect()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await request.json()
  const vehicle = await Vehicle.create({ ...data, userId: session.user.id })
  return NextResponse.json(vehicle, { status: 201 })
}
