import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import Vehicle from '@/lib/models/Vehicle'
import { dbConnect } from '@/lib/db/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  await dbConnect()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const data = await request.json()
  const updated = await Vehicle.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    data,
    { new: true }
  )
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, context: RouteContext) {
  await dbConnect()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const deleted = await Vehicle.findOneAndDelete({ _id: id, userId: session.user.id })
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}