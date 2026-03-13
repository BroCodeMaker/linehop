export default function LandingV2() {
  return (
    <main className="font-sans text-gray-900 bg-white">
      {/* HERO */}
      <section className="min-h-screen flex items-center bg-white px-6 py-16 md:px-16">
        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <span className="inline-block bg-orange-100 text-orange-600 text-sm font-semibold px-3 py-1 rounded-full mb-6">
              🍽️ Para restaurante
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-gray-900">
              Restaurantul este plin?<br />
              <span className="text-orange-500">Nu mai pierde clienți</span> care pleacă.
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Clienții scanează QR-ul și intră în lista de așteptare. Îi anunți pe WhatsApp când masa este gata.
            </p>
            <a
              href="mailto:contact@linehop.ro"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg"
            >
              Programează demo →
            </a>
            <p className="mt-4 text-sm text-gray-400">Primele 30 zile gratuit. Fără card de credit.</p>
          </div>

          {/* Right */}
          <div className="flex flex-col items-center gap-6">
            {/* QR mockup */}
            <div className="bg-white border-2 border-gray-100 shadow-2xl rounded-2xl p-8 flex flex-col items-center gap-3 w-64">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">QR LineHop</p>
              <div className="w-40 h-40 border-2 border-gray-200 rounded-lg grid grid-cols-7 gap-0.5 p-2 bg-white">
                {/* Simulated QR grid pattern */}
                {Array.from({ length: 49 }).map((_, i) => {
                  const corners = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48];
                  const inner = [8,9,10,15,16,17,22,23,24];
                  const filled = corners.includes(i) || inner.includes(i) || (i % 3 === 0 && i > 28) || (i === 11) || (i === 37) || (i === 33);
                  return (
                    <div
                      key={i}
                      className={`rounded-sm ${filled ? "bg-gray-900" : "bg-white"}`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 font-medium">Scanează pentru a intra în coadă</p>
            </div>

            {/* Phone status card */}
            <div className="bg-white border border-gray-200 shadow-xl rounded-2xl px-6 py-4 w-64">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-green-600">Live</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">Poziția ta în coadă</p>
              <p className="text-3xl font-extrabold text-orange-500">#1</p>
              <p className="text-sm text-gray-500 mt-1">Timp estimat: <span className="font-semibold text-gray-800">~15 min</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-orange-50 py-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12 text-gray-900">Cum funcționează?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow p-6 border-t-4 border-orange-400">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-bold text-lg mb-2">Scanezi QR</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Scanezi codul QR de la intrarea restaurantului și te înscrii în coadă direct de pe telefon.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 border-t-4 border-blue-400">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-lg mb-2">Primești actualizări</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Vezi poziția în coadă și timpul estimat de așteptare.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 border-t-4 border-green-400">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-bold text-lg mb-2">Vii când ești chemat</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Primești notificare WhatsApp când masa este aproape gată și confirmi că ești pe drum.
              </p>
            </div>
          </div>
          <p className="text-center mt-10 text-gray-500 font-medium">
            Mai puțin haos la intrare. Clienți mai relaxați.
          </p>
        </div>
      </section>

      {/* BENEFITS RESTAURANT */}
      <section className="bg-white py-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12 text-gray-900">Beneficii pentru restaurant</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <span className="text-2xl">🪑</span>
                <div>
                  <p className="font-bold text-gray-900">Crește gradul de ocupare</p>
                  <p className="text-gray-600 text-sm">Mesele libere sunt ocupate mai rapid de grupuri potrivite.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-bold text-gray-900">Listă de așteptare clară și automată</p>
                  <p className="text-gray-600 text-sm">Fără hârtie, fără confuzii.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-2xl">😌</span>
                <div>
                  <p className="font-bold text-gray-900">Hostessul nu mai gestionează manual coada</p>
                  <p className="text-gray-600 text-sm">Se concentrează pe experiența clienților, nu pe liste.</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <span className="text-2xl">❓</span>
                <div>
                  <p className="font-bold text-gray-900">Clienții văd poziția în coadă și timpul estimat</p>
                  <p className="text-gray-600 text-sm">Mai puține întrebări la intrare.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-2xl">🏃</span>
                <div>
                  <p className="font-bold text-gray-900">Mai puțin haos la intrare</p>
                  <p className="text-gray-600 text-sm">Fluxul de intrare devine predictibil și calm.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center mt-12 text-gray-400 italic text-sm">
            Mai puțin stres la intrare și mese ocupate mai eficient.
          </p>
        </div>
      </section>

      {/* BENEFITS CLIENTS */}
      <section className="bg-gray-50 py-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12 text-gray-900">
            Experiență mai bună pentru clienți
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "🚶", text: "Nu mai stau la coadă la ușă" },
              { icon: "🗺️", text: "Pot merge la plimbare până vine masa" },
              { icon: "📊", text: "Văd poziția în timp real" },
              { icon: "📱", text: "Primesc notificare WhatsApp" },
            ].map((item) => (
              <div
                key={item.text}
                className="bg-white rounded-2xl shadow p-6 flex flex-col items-center text-center gap-3"
              >
                <span className="text-4xl">{item.icon}</span>
                <p className="font-semibold text-gray-800 text-sm leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-10 text-gray-500 font-medium">
            Clienții așteaptă mai puțin și sunt mai relaxați.
          </p>
        </div>
      </section>

      {/* DEMO VISUAL */}
      <section className="bg-gray-900 py-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12 text-white">Cum arată în practică</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Dashboard mockup */}
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
              <p className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
                Restaurantul vede lista de așteptare
              </p>
              <div className="space-y-3">
                {[
                  { name: "Popescu Ion", guests: "4 pers", time: "12 min", status: "WAITING" },
                  { name: "Ionescu Maria", guests: "2 pers", time: "8 min", status: "CALLED" },
                  { name: "Dumitru Alex", guests: "6 pers", time: "20 min", status: "WAITING" },
                  { name: "Georgescu Ana", guests: "3 pers", time: "5 min", status: "CONFIRMED" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-700 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white font-semibold text-sm">{row.name}</p>
                      <p className="text-gray-400 text-xs">{row.guests} · {row.time}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        row.status === "WAITING"
                          ? "bg-orange-500 text-white"
                          : row.status === "CALLED"
                          ? "bg-blue-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex items-center justify-center">
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-72 border-4 border-gray-700">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  Clientul vede poziția sa
                </p>
                <div className="bg-orange-50 rounded-2xl p-5 text-center mb-4">
                  <p className="text-gray-500 text-sm mb-1">Ești în lista de așteptare</p>
                  <p className="text-5xl font-extrabold text-orange-500">#3</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Timp estimat: <span className="font-bold text-gray-800">~20 min</span>
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <p className="text-sm text-green-700 font-medium">Te anunțăm pe WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-20 px-6 md:px-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Vrei să testezi LineHop în restaurantul tău?
          </h2>
          <p className="text-orange-100 text-lg mb-8">Primele 30 zile gratuit. Setup în 5 minute.</p>
          <a
            href="/login"
            className="inline-block bg-white text-orange-600 font-extrabold text-lg px-10 py-4 rounded-xl hover:bg-orange-50 transition-colors shadow-xl"
          >
            Încearcă LineHop gratuit →
          </a>
        </div>
      </section>

      {/* CONTACT */}
      <section className="bg-white py-16 px-6 md:px-16 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-2 text-gray-900">Contact LineHop</h2>
          <p className="text-gray-500 mb-6">Suntem aici să te ajutăm.</p>
          <div className="flex flex-col items-center gap-3">
            <a
              href="tel:0750198891"
              className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium"
            >
              <span>📞</span> 0750 198 891
            </a>
            <a
              href="mailto:contact@linehop.ro"
              className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium"
            >
              <span>✉️</span> contact@linehop.ro
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-50 border-t border-gray-100 py-6 px-6 text-center text-sm text-gray-400">
        © 2026 LineHop · contact@linehop.ro · Toate drepturile rezervate
      </footer>
    </main>
  );
}
