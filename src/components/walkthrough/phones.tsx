import { ArrowRight, Camera, Car, ChevronDown, Phone, Shield } from "lucide-react";

// Phone screens for the /walkthrough page. Names and numbers are made up.
function Frame({ children }: { children: React.ReactNode }) {
  return <div className="w-64 h-[460px] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl ring-1 ring-white/10 flex flex-col">{children}</div>;
}

export function PhonePerson() {
  return (
    <Frame>
      <div className="bg-white rounded-[2rem] overflow-hidden flex-1 flex flex-col">
        <div className="bg-blue-600 px-4 pt-3 pb-4">
          <p className="text-white font-bold text-sm">Add a pickup person</p>
          <p className="text-blue-100 text-xs mt-0.5">Someone you trust to collect</p>
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center">
              <Camera className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-xs font-semibold text-blue-700">Take or choose a photo</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">Full name</p>
            <p className="font-semibold text-slate-800 text-sm">Kwame Boateng</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Relationship</p>
              <p className="font-semibold text-slate-800 text-sm">Driver</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 mb-0.5 flex items-center gap-1"><Car className="w-3 h-3" /> Car number</p>
            <p className="font-bold text-slate-900 text-sm tracking-wide">GR 1234-24</p>
          </div>
          <div className="bg-blue-600 rounded-xl py-2.5 text-center">
            <p className="text-white text-xs font-bold">Add person</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function PhoneCode() {
  const corners = [0, 1, 2, 3, 7, 8, 14, 15, 16, 17, 21, 28, 30, 35, 36, 40, 41, 42, 45, 46, 47, 48];
  return (
    <Frame>
      <div className="bg-white rounded-[2rem] overflow-hidden flex-1 flex flex-col">
        <div className="bg-blue-600 px-4 pt-3 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm">VerifyGate</span>
          </div>
          <p className="text-blue-100 text-xs">Generate Pickup Pass</p>
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Child</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">K</div>
              <p className="font-semibold text-slate-800 text-sm">Kofi Mensah</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Collecting today</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">G</div>
              <p className="font-semibold text-slate-800 text-sm">Grandma Akosua</p>
            </div>
          </div>
          <div className="bg-white border-2 border-slate-200 rounded-xl p-3 flex items-center justify-center">
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 49 }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${corners.includes(i) || i % 3 === 0 ? "bg-slate-800" : "bg-white"}`} />
              ))}
            </div>
          </div>
          <div className="bg-blue-600 rounded-xl py-2.5 text-center">
            <p className="text-white text-xs font-bold">Show to Security Guard</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function PhoneGuard() {
  return (
    <Frame>
      <div className="bg-white rounded-[2rem] overflow-hidden flex-1 flex flex-col">
        <div className="bg-indigo-600 px-4 pt-3 pb-4">
          <p className="text-white font-bold text-sm">Guard Verification</p>
          <p className="text-indigo-200 text-xs mt-0.5">Code valid</p>
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center font-black text-purple-700 text-lg">K</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Kofi Mensah</p>
                <p className="text-xs text-slate-500">Primary 3</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <p className="text-xs text-green-600 font-medium">Verified</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1.5">Authorised collector</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-700 text-xs">G</div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Grandma Akosua</p>
                <p className="text-xs text-slate-400">Added by the parent</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">Time</p>
            <p className="text-xs font-bold text-slate-700">2:47 PM · Today</p>
          </div>
          <div className="bg-green-500 rounded-xl py-2.5 text-center">
            <p className="text-white text-xs font-bold">Confirm Pickup</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function PhoneSms() {
  return (
    <Frame>
      <div className="bg-slate-800 rounded-[2rem] overflow-hidden flex-1 flex flex-col">
        <div className="bg-slate-700 px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-bold">Messages</p>
            <p className="text-slate-400 text-xs">VerifyGate</p>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="bg-green-600 rounded-2xl rounded-tl-sm px-4 py-3 mb-2">
              <p className="text-white text-xs leading-relaxed">
                <strong>Kofi Mensah</strong> was picked up by <strong>Grandma Akosua</strong> at <strong>2:47 PM</strong> from{" "}
                <strong>Bright Future Academy</strong>.
              </p>
            </div>
            <p className="text-slate-500 text-xs text-center mt-3">Today, 2:47 PM</p>
          </div>
          <div className="bg-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
            <p className="text-slate-400 text-xs flex-1">Reply...</p>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ---- Screens for guards and teachers (dark, like the real scanner) ----

function DarkScreen({ children }: { children: React.ReactNode }) {
  return <div className="bg-slate-950 rounded-[2rem] overflow-hidden flex-1 flex flex-col text-white">{children}</div>;
}

export function PhoneScanner() {
  return (
    <Frame>
      <DarkScreen>
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-slate-800">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center"><Shield className="w-3 h-3 text-white" /></div>
          <span className="text-xs font-bold">VerifyGate</span>
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="text-center">
            <p className="font-bold text-base">Scan Pickup QR</p>
            <p className="text-slate-400 text-[11px] mt-1 leading-snug">Point the camera at the parent&apos;s QR code.</p>
          </div>
          <div className="relative mx-auto w-36 h-36 rounded-2xl bg-slate-800 flex items-center justify-center">
            <Camera className="w-10 h-10 text-slate-600" />
            <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
            <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />
          </div>
          <div className="bg-blue-600 rounded-xl py-2.5 text-center">
            <p className="text-white text-xs font-bold flex items-center justify-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Start Scanning</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px] text-center mb-1.5">Or enter code manually</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 font-mono tracking-widest text-xs text-slate-300">K7MX3P</div>
              <div className="bg-slate-600 rounded-lg px-3 py-2 text-xs font-bold">Go</div>
            </div>
          </div>
        </div>
      </DarkScreen>
    </Frame>
  );
}

export function PhoneVerify() {
  return (
    <Frame>
      <DarkScreen>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-green-400 text-xs font-medium">Code Valid</span>
          </div>
          <div className="bg-slate-800 rounded-2xl p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Authorized to collect</p>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-purple-600/30 ring-2 ring-purple-400/50 flex items-center justify-center text-lg font-bold text-purple-300 shrink-0">KB</div>
              <div className="min-w-0">
                <p className="text-sm font-bold">Kwame Boateng</p>
                <p className="text-slate-400 text-[11px]">Driver</p>
                <p className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md px-1.5 py-0.5">
                  <Car className="w-3 h-3" /> GR 1234-24
                </p>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] mt-2">Parent: Abena Mensah</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Child</p>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-purple-200 flex items-center justify-center font-black text-purple-700 text-xl shrink-0">K</div>
              <div>
                <p className="text-sm font-bold">Kofi Mensah</p>
                <p className="text-slate-300 text-[11px]">Primary 3</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Tap photo to enlarge</p>
              </div>
            </div>
          </div>
          <div className="bg-green-600 rounded-xl py-2.5 text-center">
            <p className="text-white text-xs font-bold">Confirm Pickup</p>
          </div>
        </div>
      </DarkScreen>
    </Frame>
  );
}

export function PhoneConfirmed() {
  return (
    <Frame>
      <DarkScreen>
        <div className="p-4 flex-1 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="m8 12.5 3 3 5-6" />
            </svg>
          </div>
          <p className="text-lg font-bold text-green-300">Pickup Confirmed!</p>
          <p className="text-green-400/70 text-xs leading-snug px-2">1 child logged. Redirecting to scanner...</p>
          <p className="text-slate-500 text-[11px] leading-snug px-4 mt-2">The parent gets a text message and the school keeps the record.</p>
        </div>
      </DarkScreen>
    </Frame>
  );
}
