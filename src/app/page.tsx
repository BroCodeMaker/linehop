import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-2xl font-black text-orange-500 tracking-tight">LineHop</span>
          <Link
            href="/app/login"
            className="bg-gray-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-sm font-semibold px-4 py-2 rounded-full mb-8">
          🍽️ Lista de așteptare digitală pentru restaurante
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
          Restaurantul este plin?{" "}
          <span className="text-orange-500">Nu mai pierde clienți care pleacă.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
          Clienții scanează QR-ul și intră în lista de așteptare. Îi anunți pe WhatsApp când masa este gata.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:contact@linehop.ro"
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-orange-200 transition-colors"
          >
            Programează demo →
          </a>
          <Link
            href="/app/login"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-bold text-lg px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-colors"
          >
            Intră în dashboard
          </Link>
        </div>
      </section>

      {/* SECTION 2 — CUM FUNCȚIONEAZĂ */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-gray-900 mb-4">
            Cum funcționează?
          </h2>
          <p className="text-center text-gray-500 mb-14 text-lg">Simplu, rapid, fără aplicație instalată.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl">
                📷
              </div>
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">Pasul 1</span>
              <h3 className="text-xl font-bold text-gray-900">Scanezi QR</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Scanezi codul QR de la intrarea restaurantului și te înscrii în coadă direct de pe telefon.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
                📊
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Pasul 2</span>
              <h3 className="text-xl font-bold text-gray-900">Primești actualizări</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Vezi poziția în coadă și timpul estimat de așteptare.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">
                🔔
              </div>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Pasul 3</span>
              <h3 className="text-xl font-bold text-gray-900">Vii când ești chemat</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Primești notificare WhatsApp când masa este aproape gata și confirmi că ești pe drum.
              </p>
            </div>
          </div>
          <p className="text-center text-gray-400 italic mt-10 text-base">
            Mai puțin haos la intrare. Clienți mai relaxați.
          </p>
        </div>
      </section>

      {/* SECTION 3 — BENEFICII RESTAURANT */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-gray-900 mb-14">
            Beneficii pentru restaurant
          </h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 flex flex-col gap-5">
            {[
              "Crește gradul de ocupare la mese — mesele libere sunt ocupate mai rapid de grupuri potrivite",
              "Clienții văd poziția în coadă și timpul estimat — mai puține întrebări la intrare",
              "Listă de așteptare clară și automată",
              "Hostess-ul nu mai gestionează manual coada",
              "Mai puțin haos la intrare",
            ].map((item) => (
              <div key={item} className="flex items-start gap-4">
                <span className="text-xl mt-0.5 flex-shrink-0">✅</span>
                <span className="text-gray-700 text-base leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 mt-8 text-base">
            Mai puțin stres la intrare și mese ocupate mai eficient.
          </p>
        </div>
      </section>

      {/* SECTION 4 — BENEFICII CLIENȚI */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-gray-900 mb-14">
            Experiență mai bună pentru clienți
          </h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 flex flex-col gap-5">
            {[
              ["🚶", "Nu mai stau la coadă la ușă"],
              ["🗺️", "Pot merge la plimbare până vine masa"],
              ["📊", "Văd poziția în listă în timp real"],
              ["📱", "Primesc notificare WhatsApp când masa este gata"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-start gap-4">
                <span className="text-xl mt-0.5 flex-shrink-0">{icon}</span>
                <span className="text-gray-700 text-base leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 mt-8 text-base">
            Clienții așteaptă mai puțin și sunt mai relaxați.
          </p>
        </div>
      </section>

      {/* SECTION 5 — DEMO VIZUAL */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-center text-gray-900 mb-14">
            Cum arată în practică
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Dashboard mockup */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-gray-700 text-center">
                Așa vede restaurantul lista de așteptare
              </h3>
              <div className="bg-gray-100 rounded-3xl shadow-md border border-gray-200 p-8 min-h-64 flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Dashboard LineHop</span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">OPEN</span>
                </div>
                {[
                  { name: "Andrei P.", time: "18 min", pos: 1, status: "CALLED" },
                  { name: "Maria I.", time: "32 min", pos: 2, status: "WAITING" },
                  { name: "Radu C.", time: "12 min", pos: 3, status: "WAITING" },
                ].map((entry) => (
                  <div key={entry.name} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-orange-100 text-orange-600 text-xs font-bold rounded-full flex items-center justify-center">
                        {entry.pos}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{entry.time}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        entry.status === "CALLED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-gray-700 text-center">
                Așa vede clientul poziția în coadă și timpul estimat
              </h3>
              <div className="mx-auto w-56 bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  <div className="bg-orange-500 px-4 pt-6 pb-5 text-center">
                    <p className="text-white text-xs font-semibold opacity-80 mb-1">LineHop</p>
                    <p className="text-white text-lg font-black">Restaurant Bella</p>
                  </div>
                  <div className="px-4 py-5 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-3xl font-black text-orange-500">2</span>
                    </div>
                    <p className="text-xs text-gray-500 text-center leading-snug">Ești pe locul 2 în coadă</p>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-center w-full">
                      <p className="text-xs text-gray-400">Timp estimat</p>
                      <p className="text-xl font-black text-gray-900">~15 min</p>
                    </div>
                    <p className="text-xs text-gray-400 text-center leading-snug">
                      Te anunțăm pe WhatsApp când masa este gata
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA FINAL */}
      <section className="bg-orange-500 py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            Vrei să testezi LineHop în restaurantul tău?
          </h2>
          <p className="text-orange-100 text-xl mb-10">Primele 30 zile gratuit.</p>
          <Link
            href="/app/login"
            className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-black text-lg px-10 py-4 rounded-2xl shadow-lg hover:bg-orange-50 transition-colors"
          >
            Încearcă LineHop gratuit →
          </Link>
        </div>
      </section>

      {/* SECTION 7 — CONTACT */}
      <section className="py-24">
        <div className="max-w-lg mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Contact LineHop</h2>
          <p className="text-gray-500 text-lg mb-10">Suntem aici să te ajutăm.</p>
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-10 flex flex-col items-center gap-6">
            <a
              href="tel:0750198891"
              className="flex items-center gap-3 text-gray-900 font-semibold text-lg hover:text-orange-500 transition-colors"
            >
              <span className="text-2xl">📞</span> 0750 198 891
            </a>
            <a
              href="mailto:contact@linehop.ro"
              className="flex items-center gap-3 text-orange-500 font-semibold text-lg hover:text-orange-600 transition-colors"
            >
              <span className="text-2xl">✉️</span> contact@linehop.ro
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FOOTER */}
      <footer className="border-t border-gray-100 py-6 text-center text-gray-400 text-sm">
        © 2026 LineHop · contact@linehop.ro
      </footer>
    </div>
  );
}
