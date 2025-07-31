'use client';

import { motion } from 'framer-motion';
import { Truck, MapPin, Send, User } from 'lucide-react';
import Image from 'next/image';

const features = [
  {
    icon: <Send className="w-8 h-8 text-indigo-400" />,
    title: 'Objavi dostavu',
    desc: 'Dodaj destinaciju, detalje i objavi oglas za selidbu ili dostavu.'
  },
  {
    icon: <Truck className="w-8 h-8 text-indigo-400" />,
    title: 'Ponude vozača',
    desc: 'Lokalni vozači ti šalju ponude. Odaberi najbolju.'
  },
  {
    icon: <MapPin className="w-8 h-8 text-indigo-400" />,
    title: 'Prati isporuku',
    desc: 'Prati isporuku uživo i ostavi recenziju.'
  }
];

const testimonials = [
  {
    name: 'Mehmed B.',
    text: 'Najlakši način da nađem prevoz za selidbu. Vozač stigao za 30 minuta!',
    role: 'Korisnik iz Bihaća'
  },
  {
    name: 'Adnan T.',
    text: 'Kao vozač konačno imam više posla i manje praznih vožnji.',
    role: 'Dostavljač iz Tuzle'
  }
];

export default function Home() {
  return (
    <main className="bg-gradient-to-br from-zinc-900 to-black text-white">
  <section className="relative overflow-hidden bg-hero">
  <div className="flex items-center justify-center h-full">
    <div className="text-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent"
      >
        Lokalna dostava na tvoj način
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-lg text-gray-800 max-w-2xl mx-auto"
      >
        Objavi selidbu ili dostavu. Vozači iz tvoje blizine ti odmah šalju ponude.
      </motion.p>
      <motion.a
        href="/register"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-block mt-8 px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl shadow-lg transition"
      >
        Započni odmah
      </motion.a>
    </div>
  </div>
</section>

      <section className="bg-zinc-950 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Kako funkcioniše Deliver4Me?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="bg-zinc-800 rounded-xl p-6 text-center shadow-md hover:shadow-indigo-500/30 hover:ring-1 hover:ring-indigo-500 transition-all"
              >
                <div className="flex justify-center mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-zinc-900">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Šta kažu naši korisnici?</h2>
          <div className="grid md:grid-cols-2 gap-10">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.3 }}
                className="bg-zinc-800 p-6 rounded-xl shadow-md"
              >
                <p className="text-gray-300 italic mb-4">“{t.text}”</p>
                <div className="text-sm text-gray-400">
                  — <span className="font-semibold text-white">{t.name}</span>, {t.role}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

<section className="py-20 bg-zinc-950 text-center px-6">
  <div className="max-w-4xl mx-auto">
    <h2 className="text-3xl font-bold mb-6">Zašto Deliver4Me?</h2>
    <p className="text-gray-400 text-lg mb-10">
      Naša misija je povezati ljude kojima treba dostava sa pouzdanim lokalnim vozačima — brzo, jednostavno i sigurno.
    </p>
    <div className="grid md:grid-cols-3 gap-8 text-left">
      <div>
        <h3 className="text-xl font-semibold text-indigo-400 mb-2">Pouzdanost</h3>
        <p className="text-gray-400">Svi vozači su provjereni, ocijenjeni i ocjenjuju se nakon svake isporuke.</p>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-indigo-400 mb-2">Fleksibilnost</h3>
        <p className="text-gray-400">Objavi dostavu kad ti treba — bez poziva, bez čekanja.</p>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-indigo-400 mb-2">Lokalna zajednica</h3>
        <p className="text-gray-400">Pomažemo vozačima da imaju više posla, a korisnicima da uštede vrijeme.</p>
      </div>
    </div>
  </div>
</section>


<section className="py-20 bg-zinc-900">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 px-6">
    <Image
      src="/mapa-dostava.png"
      alt="Mapa pokrivenosti"
      width={500}
      height={400}
      className="rounded-xl shadow-lg"
    />
    <div>
      <h2 className="text-3xl font-bold mb-4">Pokreni dostavu gdje god da si</h2>
      <p className="text-gray-400 text-lg mb-6">
        Trenutno aktivni u preko <strong className="text-indigo-400">15 gradova</strong> širom BiH — i širimo se!
      </p>
      <ul className="text-left text-gray-300 space-y-2">
        <li>Sarajevo, Banja Luka, Tuzla, Zenica...</li>
        <li>Vozači dostupni 24/7</li>
        <li>Praćenje isporuke uživo</li>
      </ul>
    </div>
  </div>
</section>

<section className="py-20 bg-zinc-950 text-center">
  <div className="max-w-4xl mx-auto px-6">
    <h2 className="text-3xl font-bold mb-10">Deliver4Me u brojkama</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-indigo-400 font-semibold text-2xl">
      <div>
        <p>12,000+</p>
        <p className="text-sm text-gray-400">Uspješnih dostava</p>
      </div>
      <div>
        <p>1,500+</p>
        <p className="text-sm text-gray-400">Aktivnih vozača</p>
      </div>
      <div>
        <p>98.7%</p>
        <p className="text-sm text-gray-400">Zadovoljstvo korisnika</p>
      </div>
    </div>
  </div>
</section>

<section className="py-20 bg-white text-center">
  <h2 className="text-3xl font-bold mb-10 text-gray-900">Sponzori</h2>
  <div className="flex flex-wrap justify-center items-center gap-10 opacity-70">
    <Image src="/moveit.png" alt="Partner 1" width={120} height={60} />
    <Image src="/stowaway.png" alt="Partner 2" width={120} height={60} />
    <Image src="/shift.png" alt="Partner 3" width={120} height={60} />
    <Image src="/boxedup.png" alt="Partner 4" width={120} height={60} />
  </div>
</section>


<section className="py-20 bg-zinc-950">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center px-6 gap-10">
    <div className="flex-1">
      <h2 className="text-3xl font-bold mb-4">Aplikacija ti je pri ruci</h2>
      <p className="text-gray-400 text-lg mb-6">Prati, komuniciraj i recenziraj — sve sa svog telefona.</p>
      <a href="/register" className="inline-block px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow transition">
        Registruj se i testiraj aplikaciju
      </a>
    </div>
    <Image
      src="/hero.jpg"
      alt="Mobile App Preview"
      width={600}
      height={800}
      className="rounded-2xl shadow-2xl"
    />
  </div>
</section>


      <section className="py-20  bg-zinc-900 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Spreman da pronađeš svog vozača?</h2>
        <p className="text-lg text-white/80 mb-8">Pridruži se stotinama korisnika koji koriste Deliver4Me svaki dan.</p>
        <a
          href="/register"
          className="inline-block px-8 py-3 bg-white text-indigo-600 font-medium rounded-xl shadow-md hover:bg-gray-100 transition"
        >
          Registruj se sada
        </a>
      </section>
    </main>
  );
}
