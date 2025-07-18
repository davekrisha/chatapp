import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";

const Navbar = () => {
  const authUser = useAuthStore((state) => state.authUser);
  const logout = useAuthStore((state) => state.logout);

  return (
    <nav className="w-full flex items-center justify-between p-4 bg-base-100 shadow">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatty</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors
              
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {authUser && (
        <div className="flex items-center gap-2">
          <span>{authUser.fullName}</span>
          <button onClick={logout} className="ml-4 px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">Logout</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;