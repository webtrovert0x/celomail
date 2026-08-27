'use client'

import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Globe, ArrowRight, Settings } from 'lucide-react'

export default function Home() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#0A0A0A] selection:bg-yellow-500/30">
      {/* Immersive Background Gradients (Muted for premium aesthetic) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>

      <main className="relative z-10 flex flex-col items-center justify-center p-8 text-center max-w-5xl w-full">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image src="/IMG_6074.PNG" alt="cmail logo" width={120} height={120} className="mb-10 rounded-3xl shadow-2xl ring-1 ring-white/10 object-contain bg-white" unoptimized />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-tight"
        >
          Welcome to <br className="md:hidden" />
          <span className="text-white">
            cmail
          </span>
          <span className="text-yellow-500">.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-400 mb-16 max-w-2xl font-light leading-relaxed"
        >
          The future of decentralized, permissionless, and zero-knowledge encrypted communication. Your identity, your inbox.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          {isConnected ? (
            <div className="flex flex-col items-center gap-6 p-8 bg-[#111111] border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl relative group">
              
              <div className="flex flex-col items-center z-10">
                <span className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Secure Connection</span>
                <span className="text-lg text-slate-200 font-mono bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              
              <div className="z-10 w-full flex justify-center">
                <button 
                  onClick={() => open()}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-medium transition-colors flex items-center gap-2 border border-white/5 hover:border-white/10"
                >
                  <Settings size={18} />
                  Manage Wallet
                </button>
              </div>
              
              <Link href="/dashboard" className="w-full z-10 mt-2">
                <button className="w-full px-8 py-4 bg-[#1AB775] text-black text-lg font-bold rounded-xl hover:bg-[#159a62] transition-colors flex items-center justify-center gap-2 group">
                  Enter Dashboard
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          ) : (
            <button
              onClick={() => open()}
              className="w-full px-8 py-5 bg-[#1AB775] text-black text-lg font-bold rounded-xl hover:bg-[#159a62] transition-colors flex items-center justify-center gap-3"
            >
              <ShieldCheck size={24} />
              Connect Wallet
            </button>
          )}
        </motion.div>

        {/* Feature Highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl"
        >
          {[
            { icon: <ShieldCheck size={32} className="text-yellow-400" />, title: "End-to-End Encrypted", desc: "Military-grade encryption before IPFS upload." },
            { icon: <Globe size={32} className="text-yellow-400" />, title: "Decentralized Identity", desc: "No central servers. You own your Celo alias." },
            { icon: <Zap size={32} className="text-yellow-300" />, title: "Gasless UX", desc: "Lightning fast. Sub-cent transaction fees." }
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center p-8 bg-[#111111] border border-white/5 rounded-3xl hover:border-white/10 transition-colors">
              <div className="p-4 bg-white/5 rounded-2xl mb-5">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </motion.div>

      </main>
    </div>
  )
}
