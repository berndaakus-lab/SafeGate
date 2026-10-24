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
