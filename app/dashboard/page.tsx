import {redirect} from 'next/navigation';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/api/auth/[...nextauth]/route';
import {db} from '@/lib/db';
import {balance} from '@/lib/ledger';
import Nav from '@/components/Nav';
import StatCard from '@/components/StatCard';
import MarketTicker from '@/components/MarketTicker';
import Link from 'next/link';
import EquityChart from '@/components/EquityChart';

export default async function Dashboard(){
 const s=await getServerSession(authOptions); if(!s)redirect('/login');
 const a=await db.ledgerAccount.findUnique({where:{code:`USER:${s.user.id}:USD`}});
 const entries=a?await db.ledgerEntry.findMany({where:{accountId:a.id},orderBy:{createdAt:'asc'},take:200}):[];
 let running=0; const equity=entries.map((e,i)=>{running+=e.type==='CREDIT'?Number(e.amount):-Number(e.amount);return {t:String(i+1),v:running}});
 const bal=Number(a?await balance(db,a.id):0);
 const positions=await db.position.findMany({where:{userId:s.user.id,status:'OPEN'},include:{instrument:true}});
 const unrealized=positions.reduce((sum,p)=>{const px=Number(p.instrument.price),entry=Number(p.entryPrice),q=Number(p.quantity);return sum+(p.side==='BUY'?(px-entry)*q:(entry-px)*q)},0);
 const market=(await db.instrument.findMany({where:{enabled:true}})).map(x=>({symbol:x.symbol,price:Number(x.price),change:0}));
 return <><Nav/><main className="mx-auto max-w-7xl px-4 py-6"><MarketTicker initial={market}/><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><StatCard label="Available balance" value={`$${bal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}/><StatCard label="Unrealized P&L" value={`${unrealized>=0?'+':''}$${unrealized.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}/><StatCard label="Open positions" value={String(positions.length)}/><StatCard label="KYC" value={String((await db.user.findUnique({where:{id:s.user.id},select:{kycStatus:true}}))?.kycStatus)}/><StatCard label="Account" value={s.user.email??''}/></div><section className="card mt-5 p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Cash equity curve</h2><Link href="/trade" className="gold text-sm">Open terminal</Link></div><EquityChart data={equity.length?equity:[{t:'0',v:0}]}/><div className="mt-5 flex items-center justify-between"><h2 className="font-bold">Open positions</h2><Link href="/trade" className="gold text-sm">Trade</Link></div>{positions.length===0?<p className="mt-6 muted">No open positions yet. Place a market order to start.</p>:<div className="mt-4 space-y-2">{positions.map(p=>{const pnl=p.side==='BUY'?(Number(p.instrument.price)-Number(p.entryPrice))*Number(p.quantity):(Number(p.entryPrice)-Number(p.instrument.price))*Number(p.quantity);return <div key={p.id} className="flex flex-wrap justify-between gap-3 border-b border-white/10 py-3"><span>{p.instrument.symbol} · {p.side} · {Number(p.quantity).toLocaleString()}</span><span className={pnl>=0?'text-profit':'text-loss'}>{pnl>=0?'+':''}${pnl.toFixed(2)}</span></div>})}</div>}</section></main></>
}
