import {PrismaClient,Role} from '@prisma/client';
import bcrypt from 'bcryptjs';
const db=new PrismaClient();
async function main(){
 const email=process.env.ADMIN_EMAIL||'admin@aurevia.exchange'; const password=process.env.ADMIN_PASSWORD||'ChangeMe_123!';
 const hash=await bcrypt.hash(password,12);
 const admin=await db.user.upsert({where:{email},update:{passwordHash:hash,role:Role.ADMIN,status:'ACTIVE'},create:{email,passwordHash:hash,name:'Aurevia Administrator',role:Role.ADMIN}});
 for(const i of [{symbol:'AUR/USD',name:'Aurevia Dollar',baseAsset:'AUR',quoteAsset:'USD',price:100},{symbol:'BTC/USD',name:'Bitcoin / USD',baseAsset:'BTC',quoteAsset:'USD',price:65000},{symbol:'ETH/USD',name:'Ethereum / USD',baseAsset:'ETH',quoteAsset:'USD',price:3200},{symbol:'EUR/USD',name:'Euro / US Dollar',baseAsset:'EUR',quoteAsset:'USD',price:1.08}]) await db.instrument.upsert({where:{symbol:i.symbol},update:{price:i.price},create:i});
 await db.systemSetting.upsert({where:{key:'defaultLeverage'},update:{value:'1'},create:{key:'defaultLeverage',value:'1'}});
 await db.auditLog.create({data:{actorId:admin.id,action:'SEED',entity:'SYSTEM',metadata:{message:'Initial system seed'}}});
 console.log(`Admin: ${email}`);
}
main().finally(()=>db.$disconnect());
