import { UserRole } from "../types";

interface Props {
  onLogin: (role: UserRole) => void;
}

export const LoginPage: React.FC<Props> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg border border-slate-200 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 text-teal-700 font-bold text-xl">D</div>
          <h1 className="text-2xl font-bold text-slate-800">Dream Agency</h1>
          <p className="text-slate-500 text-sm">Choose your portal to continue</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
            onClick={() => onLogin(UserRole.AGENT)}
          >
            Continue as Agent
          </button>
          <button
            className="w-full py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 transition"
            onClick={() => onLogin(UserRole.CUSTOMER)}
          >
            Continue as Customer
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Demo mode: this selects a mock user profile for the chosen role.
        </p>
      </div>
    </div>
  );
};
