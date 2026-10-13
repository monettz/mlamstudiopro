import { customerUser } from '@/lib/customer';
export async function GET() {
  const user=await customerUser();
  return Response.json({user:user?{name:user.full_name,email:user.email,emailVerified:!!user.email_verified_at}:null},{headers:{'Cache-Control':'no-store'}});
}
