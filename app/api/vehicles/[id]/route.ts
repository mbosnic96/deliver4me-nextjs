import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import Vehicle from '@/lib/models/Vehicle'
import { dbConnect } from '@/lib/db/db'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await dbConnect()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await request.json()
  const updated = await Vehicle.findOneAndUpdate(
    { _id: params.id, userId: session.user.id },
    data,
    { new: true }
  )
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await dbConnect()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deleted = await Vehicle.findOneAndDelete({ _id: params.id, userId: session.user.id })
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
