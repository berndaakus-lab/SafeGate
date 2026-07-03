import Link from "next/link";
import {
  Shield, CheckCircle2, ArrowRight, QrCode, Bell, Users,
  ClipboardList, Lock, MessageCircle, Phone,
  AlertTriangle, BookOpen, PhoneCall, UserCheck, Clock,
} from "lucide-react";
import { getSettings, s } from "@/lib/settings";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function SchoolPitchPage() {
  const settings = await getSettings();
  const whatsapp = s(settings, "whatsapp", "233XXXXXXXXX");

  const waMsg = encodeURIComponent(
    "Hi! I visited verifygate.app and I'm interested in setting up VerifyGate for my school. Can we talk?"
  );
  const waLink = `https://wa.me/${whatsapp}?text=${waMsg}`;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Sticky WhatsApp CTA ── */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-green-900/30 font-bold text-sm transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
        Chat with us on WhatsApp
      </a>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">VerifyGate</span>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Us
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
            🎉 First month completely free — no card required
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6">
            Your school gate,<br />
            <span className="text-blue-400">finally under control.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            VerifyGate is a secure digital system for school pickups.
            Parents generate QR codes. Guards scan and confirm. You have a full record — forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-bold text-lg inline-flex items-center justify-center gap-2 shadow-xl"
            >
              <MessageCircle className="w-5 h-5" />
              Talk to us on WhatsApp
            </a>
            <Link
              href="/get-started"
              className="border-2 border-slate-500 text-slate-300 hover:border-blue-400 hover:text-blue-400 px-8 py-4 rounded-xl font-semibold text-lg text-center transition-colors"
            >
              Request a Demo
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mt-14">
            {[
              { val: "30 sec", label: "per pickup" },
              { val: "0", label: "app downloads" },
              { val: "24 hrs", label: "to go live" },
              { val: "Flat fee", label: "per school/month" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-white">{s.val}</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="bg-amber-50 border-y border-amber-100 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <AlertTriangle className="w-3.5 h-3.5" /> The Problem Right Now
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Is your gate still running on this?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: "Paper notebook", desc: "Names get crossed out, pages torn, no one knows who really collected a child." },
              { icon: PhoneCall, title: "Phone calls to verify", desc: "Guards call parents who don't pick up. Child waits. Gate gets chaotic." },
              { icon: AlertTriangle, title: "No audit trail", desc: "If something goes wrong, there's no record of who took which child and when." },
            ].map((p) => (
              <div key={p.title} className="bg-white border-2 border-amber-200 rounded-2xl p-6">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-400 text-sm mt-8 font-medium">
            VerifyGate eliminates all three — with no hardware and no app to install.
          </p>
        </div>
      </section>

      {/* ── How it works + Screen mockups ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">See exactly how it works</h2>
          <p className="text-slate-500 text-lg">Three steps. Every role covered. Nothing to install.</p>
        </div>

        {/* Step 1 — Parent */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Step 01 · Parent
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Parent generates a pickup QR code</h3>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              Before school closes, the parent opens VerifyGate in their phone browser —
              no download needed. They pick their child and choose who is collecting them today.
              A secure QR code is generated in under 30 seconds.
            </p>
            <ul className="space-y-3">
              {[
                "Works on any phone — Android, iPhone, feature phone browser",
                "Can set a specific collector per pickup — not just one saved contact",
                "QR code expires automatically for security",
                "No login hassle — parents stay signed in",
              ].map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 text-sm">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Phone mockup — Parent QR screen */}
          <div className="shrink-0">
            <div className="w-64 bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
              <div className="bg-white rounded-[2rem] overflow-hidden">
                {/* Status bar */}
                <div className="bg-blue-600 px-4 pt-3 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">VerifyGate</span>
                  </div>
                  <p className="text-blue-100 text-xs">Generate Pickup Pass</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Child</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">K</div>
                      <p className="font-semibold text-slate-800 text-sm">Kofi Mensah · Class 3A</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Authorised Person</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">G</div>
                      <p className="font-semibold text-slate-800 text-sm">Grandma Akosua</p>
                    </div>
                  </div>
                  {/* QR code visual */}
                  <div className="bg-white border-2 border-slate-200 rounded-xl p-3 flex items-center justify-center">
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: 49 }).map((_, i) => {
                        const corners = [0,1,2,3,7,8,14,15,16,17,21,28,30,35,36,40,41,42,45,46,47,48];
                        return (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${corners.includes(i) || Math.random() > 0.5 ? "bg-slate-800" : "bg-white"}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-blue-600 rounded-xl py-2.5 text-center">
                    <p className="text-white text-xs font-bold">Show to Security Guard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 — Guard */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12 mb-24">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Step 02 · Security Guard
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Guard scans and sees everything instantly</h3>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              The security guard opens VerifyGate on any phone or tablet at the gate.
              They scan the parent&apos;s QR code — and immediately see the child&apos;s photo,
              full name, class, and the authorised collector&apos;s name. One tap confirms the pickup.
            </p>
            <ul className="space-y-3">
              {[
                "Child's photo shows — guard can visually confirm the right child",
                "Collector's name visible — no guessing who the person at the gate is",
                "Invalid or expired codes are rejected instantly",
                "No internet? Works on 2G/3G with minimal data",
              ].map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 text-sm">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Phone mockup — Guard verify screen */}
          <div className="shrink-0">
            <div className="w-64 bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
              <div className="bg-white rounded-[2rem] overflow-hidden">
                <div className="bg-indigo-600 px-4 pt-3 pb-4">
                  <p className="text-white font-bold text-sm">Guard Verification</p>
                  <p className="text-indigo-200 text-xs mt-0.5">Pickup confirmed ✓</p>
                </div>
                <div className="p-4 space-y-3">
                  {/* Child card */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center font-black text-purple-700 text-lg">K</div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Kofi Mensah</p>
                        <p className="text-xs text-slate-500">Class 3A</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          <p className="text-xs text-green-600 font-medium">Verified</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Collector */}
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1.5">Authorised Collector</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-700 text-xs">G</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Grandma Akosua</p>
                        <p className="text-xs text-slate-400">Authorised by parent</p>
                      </div>
                    </div>
                  </div>
                  {/* School */}
                  <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="text-xs font-bold text-slate-700">2:47 PM · Today</p>
                  </div>
                  <div className="bg-green-500 rounded-xl py-2.5 text-center">
                    <p className="text-white text-xs font-bold">✓ Confirm Pickup</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 — SMS */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Step 03 · Parent Notification
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Parent gets an SMS the moment it happens</h3>
            <p className="text-slate-500 text-lg leading-relaxed mb-6">
              The instant the guard confirms the pickup, VerifyGate sends an automatic SMS to the parent.
              Who collected the child, from which school, and at what time — all in one message.
              No app needed. Works on any phone.
            </p>
            <ul className="space-y-3">
              {[
                "SMS delivered even on basic (non-smartphone) phones",
                "Parents don't need to be watching the app",
                "Works for all network providers in Ghana",
                "School name included in every message",
              ].map((pt) => (
                <li key={pt} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 text-sm">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Phone mockup — SMS notification */}
          <div className="shrink-0">
            <div className="w-64 bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
              <div className="bg-slate-800 rounded-[2rem] overflow-hidden">
                <div className="bg-slate-700 px-4 py-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">Messages</p>
                    <p className="text-slate-400 text-xs">VerifyGate</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="bg-green-600 rounded-2xl rounded-tl-sm px-4 py-3 mb-2">
                    <p className="text-white text-xs leading-relaxed">
                      ✅ <strong>Kofi Mensah</strong> was picked up by{" "}
                      <strong>Grandma Akosua</strong> at <strong>2:47 PM</strong> from{" "}
                      <strong>Bright Future Academy</strong>. — VerifyGate
                    </p>
                  </div>
                  <p className="text-slate-500 text-xs text-center mt-3">Today, 2:47 PM</p>
                  <div className="mt-4 bg-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
                    <p className="text-slate-400 text-xs flex-1">Reply...</p>
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Admin Dashboard preview ── */}
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              School Admin Dashboard
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">You see everything. In real time.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              The school admin dashboard gives you a live view of every pickup, every parent, every student.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-3xl mx-auto">
            {/* Sidebar + content */}
            <div className="flex">
              {/* Mini sidebar */}
              <div className="w-40 bg-slate-900 p-4 hidden sm:block">
                <div className="flex items-center gap-1.5 mb-6">
                  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white font-bold text-xs">VerifyGate</span>
                </div>
                {[
                  { icon: ClipboardList, label: "Dashboard", active: true },
                  { icon: Users, label: "Parents", active: false },
                  { icon: UserCheck, label: "Students", active: false },
                  { icon: QrCode, label: "Pickup Logs", active: false },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-2 px-2 py-2 rounded-lg mb-1 ${item.active ? "bg-blue-600" : ""}`}>
                    <item.icon className={`w-3.5 h-3.5 ${item.active ? "text-white" : "text-slate-500"}`} />
                    <span className={`text-xs ${item.active ? "text-white font-medium" : "text-slate-500"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="flex-1 p-5">
                <p className="font-bold text-slate-900 text-sm mb-4">Bright Future Academy</p>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Parents", value: "48", color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Students", value: "63", color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Pickups Today", value: "12", color: "text-green-600", bg: "bg-green-50" },
                  ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-3`}>
                      <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {/* Recent pickups */}
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Pickups</p>
                <div className="space-y-2">
                  {[
                    { child: "Kofi Mensah", collector: "Grandma Akosua", time: "2:47 PM" },
                    { child: "Ama Owusu", collector: "Mr. Owusu (Father)", time: "2:31 PM" },
                    { child: "Yaw Asante", collector: "Erica (Driver)", time: "2:15 PM" },
                  ].map((log) => (
                    <div key={log.child} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{log.child}</p>
                          <p className="text-xs text-slate-400">by {log.collector}</p>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500">{log.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
            {[
              { icon: Users, title: "Manage Parents & Students", desc: "Add, edit, bulk import your entire school list in minutes." },
              { icon: ClipboardList, title: "Full Pickup History", desc: "Search, filter by date, export — every pickup ever recorded." },
              { icon: Lock, title: "Role-Based Access", desc: "Admins see everything. Guards see only what they need at the gate." },
            ].map((f) => (
              <div key={f.title} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center mb-3">
                  <f.icon className="w-4 h-4 text-blue-400" />
                </div>
                <p className="font-semibold text-white text-sm mb-1">{f.title}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who benefits ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Every person at your school benefits</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              role: "Principal / Admin",
              icon: ClipboardList,
              color: "bg-blue-600",
              points: ["Full pickup audit trail", "Manage all parents & students", "Know exactly what's happening at gate", "Export records anytime"],
            },
            {
              role: "Security Guard",
              icon: Shield,
              color: "bg-indigo-600",
              points: ["Scan QR in 5 seconds", "See child photo to confirm", "No training needed", "Works on any old phone"],
            },
            {
              role: "Parent",
              icon: Bell,
              color: "bg-green-600",
              points: ["Generate QR in 30 seconds", "Choose who picks up daily", "SMS the moment child leaves", "No app to download"],
            },
          ].map((p) => (
            <div key={p.role} className="border-2 border-slate-100 hover:border-blue-200 rounded-2xl p-6 transition-all">
              <div className={`w-12 h-12 ${p.color} rounded-xl flex items-center justify-center mb-4`}>
                <p.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-4">{p.role}</h3>
              <ul className="space-y-2.5">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600 text-sm">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-slate-50 border-y border-slate-100 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Priced by school size. Everything included.</h2>
            <p className="text-slate-500 text-lg mb-5">No per-parent fees. No per-scan fees. One flat rate covers your entire school.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                🎉 First month free — no credit card
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                📅 Annual plan = 2 months free
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[
              { name: "Standard", students: "Up to 100 students", highlight: false },
              { name: "Growth", students: "101 – 500 students", highlight: true, badge: "Most Popular" },
              { name: "Premier", students: "500+ students", highlight: false },
              { name: "International", students: "Any size", highlight: false, badge: "Premium", dark: true },
            ].map((t) => (
              <div key={t.name} className={`rounded-2xl overflow-hidden relative ${t.highlight ? "bg-blue-600 ring-2 ring-blue-400 shadow-2xl shadow-blue-200" : t.dark ? "bg-slate-900" : "bg-white border border-slate-100 shadow-sm"}`}>
                {t.badge && <span className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-bl-xl">{t.badge}</span>}
                <div className="p-5">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${t.highlight ? "text-blue-200" : t.dark ? "text-slate-400" : "text-slate-400"}`}>{t.students}</p>
                  <p className={`font-black text-lg mb-4 ${t.highlight ? "text-white" : t.dark ? "text-white" : "text-slate-900"}`}>{t.name}</p>
                  <div className={`rounded-xl p-3 ${t.highlight ? "bg-blue-700/50" : t.dark ? "bg-slate-800" : "bg-slate-50"}`}>
                    <p className={`text-xs mb-0.5 ${t.highlight ? "text-blue-200" : t.dark ? "text-slate-400" : "text-slate-400"}`}>Pricing</p>
                    <p className={`font-bold text-base ${t.highlight ? "text-white" : t.dark ? "text-white" : "text-slate-900"}`}>Contact us</p>
                    <p className={`text-xs mt-0.5 ${t.highlight ? "text-blue-300" : t.dark ? "text-slate-400" : "text-slate-400"}`}>First month free · Monthly or annual</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-400 text-sm">
            All plans include every feature. Contact us on WhatsApp and we&apos;ll give you your school&apos;s exact price in minutes.
          </p>
          <div className="text-center mt-4">
            <Link href="/pricing" className="text-blue-600 font-semibold text-sm hover:underline">
              See what&apos;s included on every plan →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Setup timeline ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">You can be live by tomorrow morning</h2>
          <p className="text-slate-500 text-lg">We handle everything. Here&apos;s how fast it goes:</p>
        </div>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-100" />
          {[
            { time: "Today", title: "Contact us on WhatsApp", desc: "Tell us your school name and approximate number of students. That's all we need to start." },
            { time: "Same day", title: "We set up your school", desc: "We create your school on VerifyGate, set up your admin account, and send you login details." },
            { time: "Day 1", title: "Import your students", desc: "Upload a simple spreadsheet with student names and parent contact details. We help if needed." },
            { time: "Day 2", title: "Parents get access", desc: "Parents receive a link to create their account. Takes under 2 minutes. No app download." },
            { time: "Day 3", title: "Gate goes digital", desc: "Your security guard scans their first QR code. The first SMS goes to a parent. You're live." },
          ].map((step, i) => (
            <div key={i} className="flex gap-6 mb-8 relative">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shrink-0 z-10">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 pt-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{step.time}</span>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
            🎉 First month completely free — no card, no commitment
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
            Ready to secure<br />your school gate?
          </h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">
            Join us on WhatsApp right now. We&apos;ll have your school set up within 24 hours —
            and your first month is completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-400 text-white px-10 py-4 rounded-xl font-black text-xl inline-flex items-center justify-center gap-3 shadow-2xl shadow-green-900/40 transition-all hover:scale-105"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp Us Now
            </a>
            <Link
              href="/get-started"
              className="border-2 border-slate-600 text-slate-300 hover:border-blue-400 hover:text-blue-400 px-10 py-4 rounded-xl font-semibold text-lg text-center transition-colors"
            >
              Request a Demo Online
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            Or call/email us — contacts at{" "}
            <Link href="/" className="text-blue-400 hover:underline">verifygate.app</Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
