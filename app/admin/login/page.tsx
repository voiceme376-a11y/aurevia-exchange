'use client';
import {FormEvent,useState} from 'react';
import {signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';

export default function AdminLogin(){
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const router=useRouter();
 async function submit(e:FormEvent){e.preventDefault();setError('');const r=await signIn('credentials',{email,password,redirect:false,callbackUrl:'/admin'});if(r?.ok)router.push('/admin');else setError('Invalid administrator credentials.');}
 return <main className="min-h-screen bg-black px-4 py-16"><div className="mx-auto max-w-md card p-7"><div className="gold text-sm font-bold tracking-[0.25em]">AUREVIA EXCHANGE</div><h1 className="mt-3 text-3xl font-black">Administrator sign in</h1><p className="mt-2 muted">Restricted control-center access.</p><form onSubmit={submit} className="mt-7 space-y-4"><input className="input" type="email" required placeholder="Administrator email" value={email} onChange={e=>setEmail(e.target.value)}/><input className="input" type="password" required placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p className="text-loss text-sm">{error}</p>}<button className="btn w-full bg-gold text-black">Sign in to admin</button></form></div></main>
}
